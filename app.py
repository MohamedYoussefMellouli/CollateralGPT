import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from langchain_ollama import ChatOllama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
import chromadb
import logging
from dotenv import load_dotenv

load_dotenv()

from auth import router as auth_router

# Configuration du logging
logging.basicConfig(level=logging.INFO)

# 1. Initialisation
app = FastAPI(title="CollateralGPT Decision Engine")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.126.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes
app.include_router(auth_router)
# Utilisation d'un client persistant pour stocker la base vectorielle localement
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="litigations")
embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 2. Modèles Pydantic pour la validation des données
class LitigationDetails(BaseModel):
    dispute_id: str
    counterparty_code: str
    agreement_type: str
    currency: str
    their_exposure: float
    dispute_amount: float
    current_status_code: str
    dispute_age_days: int
    free_text_comment: str

class SimilarPastDispute(BaseModel):
    id: str
    score: float
    resolution: str

class DecisionResponse(BaseModel):
    predicted_reason_code: str
    confidence_score: float
    suggested_resolution: str
    similar_past_disputes: List[SimilarPastDispute]
    estimated_resolution_days: int

class LLMDecision(BaseModel):
    predicted_reason_code: str
    confidence_score: float
    suggested_resolution: str
    similar_past_disputes: List[str]
    estimated_resolution_days: int

class ChatRequest(BaseModel):
    question: str
    language: str = "fr"  # Langue par défaut français
    history: List[dict] = []
    session_resolved: Optional[int] = None
    session_unresolved: Optional[int] = None
    session_total: Optional[int] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

# 3. Configuration du modèle LLM
llm = ChatOllama(model="mistral", temperature=0.0)

# 4. Endpoints de l'API
@app.post("/api/analyze-dispute", response_model=DecisionResponse)
async def analyze_dispute(details: LitigationDetails):
    import logging
    import time
    logger = logging.getLogger(__name__)
    
    start_time = time.time()
    logger.info(f"[DEBUT] Analyse du litige {details.dispute_id}")
    
    try:
        query_text = f"Accord: {details.agreement_type}, Montant: {details.dispute_amount}, Commentaire: {details.free_text_comment}"
        
        # Recherche de similarité dans ChromaDB
        logger.info("[STEP 1] Recherche dans ChromaDB...")
        results = collection.query(query_texts=[query_text], n_results=3)
        history = "\n".join(results['documents'][0]) if results['documents'][0] else "Aucun historique."
        logger.info(f"[STEP 1] Terminé en {time.time() - start_time:.2f}s")
        
        # Prompt structuré pour le LLM
        llm_start = time.time()
        logger.info("[STEP 2] Appel au LLM Mistral...")
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Tu es un expert financier chez Vermeg spécialisé dans la résolution des litiges de collatéral.
Si le contexte fourni contient des commentaires vagues comme 'New Comment', ignore-les et base-toi sur le 'Reason Code' pour formuler une résolution professionnelle.
Ta recommandation doit toujours suivre ce format : [Action] + [Source de vérification] + [Justification].
IMPORTANT: Pour le champ 'predicted_reason_code', tu dois OBLIGATOIREMENT utiliser l'un des Reason Codes exacts présents dans les Cas passés (ex: 'MTM Difference', 'IA Difference', 'Collateral Balance Difference'). N'invente pas de nouveaux codes.
Réponds uniquement en JSON structuré."""),
            ("human", "Litige: {current_case}\nCas passés: {history}\nRéponds en JSON.")
        ])
        
        chain = prompt | llm.with_structured_output(LLMDecision)
        llm_output = chain.invoke({"current_case": query_text, "history": history})
        logger.info(f"[STEP 2] LLM terminé en {time.time() - llm_start:.2f}s")
        
        # Préparation des résultats formatés
        similar_disputes = []
        if results['ids'] and results['ids'][0]:
            for i, doc_id in enumerate(results['ids'][0]):
                doc_text = results['documents'][0][i] if i < len(results['documents'][0]) else ""
                
                # Extraction de la résolution depuis le texte
                res = "N/A"
                if "Resolution: " in doc_text:
                    try:
                        res = doc_text.split("Resolution: ")[1].split(", Code:")[0]
                    except IndexError:
                        res = "N/A"
                
                # Calcul du score de similarité (si disponible)
                score = results['distances'][0][i] if 'distances' in results and i < len(results['distances'][0]) else 0.85
                
                similar_disputes.append(SimilarPastDispute(
                    id=str(doc_id),  # S'assurer que l'ID est une string
                    score=score, 
                    resolution=res
                ))
                
        # Construction de la réponse finale
        response_data = llm_output.model_dump()
        response_data["similar_past_disputes"] = similar_disputes
        
        logger.info(f"[FIN] Analyse complète en {time.time() - start_time:.2f}s")
        return DecisionResponse(**response_data)
        
    except Exception as e:
        logger.error(f"[ERREUR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        import re

        # ── Détection automatique de la langue de la question ──────────────────
        def detect_language(text: str) -> str:
            """Returns 'fr' or 'en' based on the question text itself, ignoring UI lang."""
            t = text.lower().strip()
            fr_markers = [
                "combien", "quel", "quelle", "quels", "quelles", "comment",
                "pourquoi", "est-ce", "donnez", "donne", "avez", "sont",
                "litiges", "litige", "résolu", "résoudre", "montant",
                "statistiques", "statistique", "contrepartie", "accord",
                "taux", "nombre", "liste", "tous", "toutes",
            ]
            en_markers = [
                "what", "how", "why", "which", "who", "where", "when",
                "how many", "how much", "give me", "show me", "list",
                "dispute", "disputes", "resolved", "resolve", "amount",
                "statistics", "counterparty", "agreement", "rate", "count",
                "total", "average",
            ]
            fr_score = sum(1 for w in fr_markers if re.search(rf'\b{w}\b', t))
            en_score = sum(1 for w in en_markers if re.search(rf'\b{w}\b', t))
            return "en" if en_score > fr_score else "fr"

        detected_lang = detect_language(request.question)

        # Détection du type de question
        question_lower = request.question.lower()
        
        # Mots clés stricts pour les questions statistiques
        stat_keywords = [
            "combien", "nombre", "total", "statistique", "statistiques", "moyenne", 
            "tous", "liste", "quels sont", "how many", "count", "how much", "total amount",
        ]
        
        is_statistical = any(re.search(rf'\b{re.escape(word)}\b', question_lower) for word in stat_keywords)
        
        total_docs = collection.count()
        
        # Instruction de langue basée sur la détection automatique
        if detected_lang == "en":
            response_instruction = "CRITICAL: The user asked in ENGLISH. You MUST reply entirely in English."
        else:
            response_instruction = "CRITIQUE : L'utilisateur a posé sa question en FRANÇAIS. Tu DOIS répondre entièrement en français."
        
        if is_statistical:
            # Pour les questions statistiques, lire directement le CSV
            df = pd.read_csv('vermeg.csv', sep=';')
            df.columns = df.columns.str.strip()
            
            # Nettoyage des données
            df['RECONCILIATION_COMMENT'] = df['RECONCILIATION_COMMENT'].fillna('')
            df['REASON_CODE'] = df['REASON_CODE'].fillna('')
            
            # Un litige est résolu si RECONCILIATION_COMMENT n'est pas vide et ne contient pas "zeineb"
            resolved = df[
                (df['RECONCILIATION_COMMENT'].str.strip() != '') & 
                (~df['RECONCILIATION_COMMENT'].str.lower().str.contains('zeineb'))
            ]

            # Statistiques par défaut (du CSV global)
            csv_total_litiges = len(df)
            csv_resolved_count = len(resolved)
            csv_unresolved_count = csv_total_litiges - csv_resolved_count

            # Surcharger avec les statistiques de la session utilisateur si disponibles
            total_litiges = request.session_total if request.session_total is not None else csv_total_litiges
            resolved_count = request.session_resolved if request.session_resolved is not None else csv_resolved_count
            unresolved_count = request.session_unresolved if request.session_unresolved is not None else csv_unresolved_count
            
            # Statistiques par reason code
            reason_codes = df['REASON_CODE'].value_counts().to_dict()
            
            # Statistiques par accord
            agreements = df['AGREEMENT_DESC'].value_counts().to_dict()
            
            # Statistiques par contrepartie
            counterparties = df['COUNTERPARTY_CODE'].value_counts().to_dict()
            
            # Montants
            avg_amount = df['DISPUTE_AMOUNT'].mean()
            total_amount = df['DISPUTE_AMOUNT'].sum()
            max_amount = df['DISPUTE_AMOUNT'].max()
            
            if detected_lang == "en":
                context = f"""Complete statistics from the CollateralGPT database:

GENERAL SUMMARY:
- Total disputes: {total_litiges}
- Resolved disputes (with RECONCILIATION_COMMENT): {resolved_count}
- Unresolved disputes (without RECONCILIATION_COMMENT): {unresolved_count}
- Resolution rate: {(resolved_count/total_litiges*100):.1f}%

AMOUNTS:
- Total dispute amount: {total_amount:,.2f}
- Average amount per dispute: {avg_amount:,.2f}
- Maximum amount: {max_amount:,.2f}

DISPUTE TYPES (REASON_CODE):
{chr(10).join([f"- {k}: {v} cases" for k, v in list(reason_codes.items())[:10] if k])}

AGREEMENT TYPES:
{chr(10).join([f"- {k}: {v} cases" for k, v in list(agreements.items())[:10] if k])}

MAIN COUNTERPARTIES:
{chr(10).join([f"- {k}: {v} cases" for k, v in list(counterparties.items())[:5]])}

RESOLUTION EXAMPLES:
{chr(10).join(resolved['RECONCILIATION_COMMENT'].unique()[:10])}"""
            else:
                context = f"""Statistiques complètes de la base de données CollateralGPT:

RÉSUMÉ GÉNÉRAL:
- Total de litiges: {total_litiges}
- Litiges résolus (avec RECONCILIATION_COMMENT): {resolved_count}
- Litiges non résolus (sans RECONCILIATION_COMMENT): {unresolved_count}
- Taux de résolution: {(resolved_count/total_litiges*100):.1f}%

MONTANTS:
- Montant total des litiges: {total_amount:,.2f}
- Montant moyen par litige: {avg_amount:,.2f}
- Montant maximum: {max_amount:,.2f}

TYPES DE LITIGES (REASON_CODE):
{chr(10).join([f"- {k}: {v} cas" for k, v in list(reason_codes.items())[:10] if k])}

TYPES D'ACCORDS:
{chr(10).join([f"- {k}: {v} cas" for k, v in list(agreements.items())[:10] if k])}

PRINCIPALES CONTREPARTIES:
{chr(10).join([f"- {k}: {v} cas" for k, v in list(counterparties.items())[:5]])}

EXEMPLES DE RÉSOLUTIONS:
{chr(10).join(resolved['RECONCILIATION_COMMENT'].unique()[:10])}"""

        else:
            # Recherche sémantique pour les questions spécifiques
            results = collection.query(query_texts=[request.question], n_results=5)
            context_docs = "\n".join(results["documents"][0]) if results["documents"][0] else "Aucun historique."
            
            if detected_lang == "en":
                context = f"Database: {total_docs} total disputes.\n\nSimilar cases found:\n{context_docs}"
            else:
                context = f"Base de données: {total_docs} litiges au total.\n\nCas similaires trouvés:\n{context_docs}"
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are CollateralGPT, a financial expert at Vermeg specializing in collateral disputes.
{response_instruction}

IMPORTANT: A dispute is considered "resolved" if it has a valid reconciliation comment (RECONCILIATION_COMMENT).
The following comments are NOT considered valid resolutions: "zeineb", empty, "nan", "null", "none".

For statistical questions, use EXACTLY the numbers provided in the context.
For resolution recommendations, use the format: [Action] + [Verification Source] + [Justification].
ANTI-HALLUCINATION WARNING: You must NEVER invent resolutions, actions, or numbers. If suggesting a resolution, you must extract it EXACTLY from the "Resolution:" field in the provided context. Do NOT invent meetings, negotiations, or generic steps. If the context does not contain a specific action, reply that you don't have enough information.

Answer naturally, without mentioning that you are an AI."""),
            ("human", "Context:\n{context}\n\nQuestion: {question}")
        ])
        
        response = (prompt | llm).invoke({"context": context, "question": request.question})
        
        # Sources pour questions non-statistiques
        sources = []
        if not is_statistical:
            results = collection.query(query_texts=[request.question], n_results=3)
            sources = results["ids"][0][:3] if results["ids"] and results["ids"][0] else []
        
        return ChatResponse(
            answer=response.content, 
            sources=sources
        )
    except Exception as e:
        import logging
        logging.error(f"Erreur dans /api/chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/seed-knowledge")
async def seed_knowledge():
    """Réinitialise la base et importe les données du CSV pour garantir la source de vérité."""
    try:
        # Nettoyage total pour éviter les ID fantômes
        try:
            chroma_client.delete_collection(name="litigations")
        except:
            pass
        
        global collection
        collection = chroma_client.create_collection(name="litigations")
        
        # Lecture du fichier CSV
        df = pd.read_csv('vermeg.csv', sep=';')
        df.columns = df.columns.str.strip()
        
        def standardize_reconciliation(reason_code, comment) -> str:
            """
            Logique métier pour transformer les commentaires vagues en résolutions exploitables.
            """
            comment_str = str(comment).strip()
            
            # Vérifier si c'est vide, NaN, 'nan' (en string) ou si ça contient un texte générique ou 'zeineb'
            if pd.isna(comment) or comment_str.lower() in ["nan", "null", "none", ""] or "new comment" in comment_str.lower() or "reconciliation" in comment_str.lower() or "zeineb" in comment_str.lower():
                mapping = {
                    "MTM Difference": "Action : Vérifier le fixing Bloomberg J-1 et réconcilier avec le MTM contrepartie.",
                    "IA Difference": "Action : Analyser l'écart d'intérêt (IA) ; comparer les courbes de taux.",
                    "Collateral Balance Difference": "Action : Vérifier les transferts de titres en attente sur le compte collatéral."
                }
                # Nettoyer le reason_code pour s'assurer que le mapping fonctionne (ex: enlever les espaces)
                rc_str = str(reason_code).strip() if not pd.isna(reason_code) else ""
                return mapping.get(rc_str, "Action : Analyse manuelle requise selon procédure standard.")
            
            return comment_str
        
        ids_list = []
        embeddings_list = []
        documents_list = []
        metadatas_list = []
        
        for _, row in df.iterrows():
            snapshot_id = str(int(row['SNAPSHOT_ID']))  # Conversion explicite en entier puis string
            
            resolution = standardize_reconciliation(row['REASON_CODE'], row['RECONCILIATION_COMMENT'])
            text = f"Accord: {row['AGREEMENT_DESC']}, Montant: {row['DISPUTE_AMOUNT']}, Resolution: {resolution}, Code: {row['REASON_CODE']}"
            
            ids_list.append(snapshot_id)
            embeddings_list.append(embeddings_model.embed_query(text))
            documents_list.append(text)
            metadatas_list.append({
                "snapshot_id": snapshot_id,
                "agreement": str(row['AGREEMENT_DESC']),
                "amount": float(row['DISPUTE_AMOUNT']),
                "resolution": resolution,
                "reason_code": str(row['REASON_CODE'])
            })
        
        # Ajout en batch
        collection.add(
            ids=ids_list,
            embeddings=embeddings_list,
            documents=documents_list,
            metadatas=metadatas_list
        )
        
        return {"status": f"Base synchronisée avec succès avec {len(df)} cas du CSV."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)