import os
import json
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from google import genai

# Load .env from backend directory first, then current working directory
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

client = None


def get_client():
    global client
    if client:
        return client
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if key:
        try:
            client = genai.Client(api_key=key)
            return client
        except Exception as e:
            print(f"Warning: Failed to initialize Gemini client: {e}")
    return None


# =========================================================
# CREDIT PROFILE CONTEXT
# =========================================================

def get_cibil_context(profile, accounts=None):
    if not profile:
        return "No credit profile available yet."

    utilization = 0.0

    if getattr(profile, "credit_limit", 0) and profile.credit_limit > 0:
        utilization = round(
            (getattr(profile, "credit_card_balance", 0.0) / profile.credit_limit) * 100,
            2
        )

    dti = 0.0

    if getattr(profile, "monthly_income", 0) and profile.monthly_income > 0:
        dti = round(
            (getattr(profile, "total_debt", 0.0) / (profile.monthly_income * 12)) * 100,
            2
        )

    accounts_str = "None logged"

    if accounts:
        accounts_list = [
            f"- {acc.account_name} ({acc.bank_name}, "
            f"Type: {acc.account_type}): "
            f"Balance ₹{acc.current_balance:,.2f}, "
            f"Limit/Principal ₹{acc.credit_limit:,.2f}, "
            f"EMI ₹{acc.monthly_emi:,.2f}, "
            f"Status: {acc.payment_status}"
            for acc in accounts
        ]

        accounts_str = "\n".join(accounts_list)

    score_val = getattr(profile, "credit_score", None)
    return f"""
Current User Credit & Financial Profile

Country: India
Credit context: CIBIL-oriented educational analysis

- Credit Score: {score_val if score_val else 'Not available'}
- Monthly Income: ₹{getattr(profile, 'monthly_income', 0.0):,.2f}
- Total Debt: ₹{getattr(profile, 'total_debt', 0.0):,.2f}
- Total Credit Card Limit: ₹{getattr(profile, 'credit_limit', 0.0):,.2f}
- Outstanding Credit Card Balance: ₹{getattr(profile, 'credit_card_balance', 0.0):,.2f}
- Credit Utilization: {utilization}%
- Debt-to-Income Ratio: {dti}%
- Active Loans: {getattr(profile, 'active_loans', 0)}
- Missed / Overdue Payments: {getattr(profile, 'missed_payments', 0)}
- Financial Goal: {getattr(profile, 'financial_goal', None) or 'Improve overall credit profile'}

Active Accounts:
{accounts_str}
"""


# =========================================================
# GEMINI API
# =========================================================

def call_gemini(prompt):
    c = get_client()
    if not c:
        return None

    # Try supported models in priority order
    candidate_models = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
    configured_model = os.getenv("GEMINI_MODEL", "").strip()
    if configured_model and configured_model not in candidate_models:
        candidate_models.insert(0, configured_model)

    for model_name in candidate_models:
        try:
            response = c.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                return response.text.strip()
        except Exception:
            continue

    return None


# =========================================================
# JSON EXTRACTION
# =========================================================

def extract_json(text):
    if not text:
        return None

    clean_text = text.strip()

    if clean_text.startswith("```"):
        clean_text = clean_text.replace("```json", "")
        clean_text = clean_text.replace("```", "")
        clean_text = clean_text.strip()

    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        return None


# =========================================================
# AI CHATBOT (Strict Multilingual Support)
# =========================================================

def generate_ai_chat_response(
    user_message: str,
    profile=None,
    accounts=None,
    chat_history=None,
    language: str = "en"
) -> dict:

    context = get_cibil_context(profile, accounts)

    # -----------------------------------------------------
    # CURRENT DATE (Safe IST timezone handling)
    # -----------------------------------------------------
    try:
        from zoneinfo import ZoneInfo
        india_now = datetime.now(ZoneInfo("Asia/Kolkata"))
    except Exception:
        india_now = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)

    current_date = india_now.strftime("%A, %d %B %Y")
    current_time = india_now.strftime("%I:%M %p")

    lowered_message = user_message.lower().strip()
    lang = (language or "en").lower().strip()

    # -----------------------------------------------------
    # HANDLE DATE QUESTIONS DIRECTLY (Multilingual)
    # -----------------------------------------------------
    date_questions_en = [
        "today's date", "todays date", "current date", "what date is it",
        "what is the date today", "what's the date today", "today date"
    ]
    date_questions_mr = [
        "आजची तारीख", "आजची तारीख काय आहे", "तारीख काय आहे", "आज किती तारीख आहे", "आजचा दिनांक"
    ]
    date_questions_hi = [
        "आज क्या तारीख है", "आज की तारीख", "तारीख क्या है", "आज कितनी तारीख है", "आज का दिनांक"
    ]

    is_mr_date = any(q in lowered_message for q in date_questions_mr)
    is_hi_date = any(q in lowered_message for q in date_questions_hi)
    is_en_date = any(q in lowered_message for q in date_questions_en)

    if lang == "mr" and (is_mr_date or is_en_date):
        return {
            "response": f"आजची तारीख **{current_date}** आहे.",
            "suggested_actions": [
                "CIBIL स्कोर कसा सुधारावा?",
                "क्रेडिट युटिलायझेशन काय आहे?",
                "कर्ज व्यवस्थापन कसे करावे?"
            ]
        }
    elif lang == "hi" and (is_hi_date or is_en_date):
        return {
            "response": f"आज की तारीख **{current_date}** है।",
            "suggested_actions": [
                "सिबिल स्कोर कैसे सुधारें?",
                "क्रेडिट यूटिलाइज़ेशन क्या है?",
                "ऋण का प्रबंधन कैसे करें?"
            ]
        }
    elif is_en_date:
        return {
            "response": f"Today is **{current_date}**.",
            "suggested_actions": [
                "What is CIBIL?",
                "How can I improve my credit score?",
                "What is credit utilization?"
            ]
        }

    # -----------------------------------------------------
    # CONVERSATION HISTORY
    # -----------------------------------------------------
    history_text = ""
    if chat_history:
        for message in chat_history[-8:]:
            m_role = getattr(message, "role", None) or (message.get("role") if isinstance(message, dict) else "user")
            m_content = getattr(message, "content", None) or (message.get("content") if isinstance(message, dict) else "")
            history_text += f"{m_role}: {m_content}\n"

    # -----------------------------------------------------
    # LANGUAGE INSTRUCTIONS FOR GEMINI
    # -----------------------------------------------------
    if lang == "mr":
        lang_instructions = """
MANDATORY LANGUAGE INSTRUCTION (STRICT PRIORITY):
- The user has selected MARATHI (मराठी).
- You MUST respond ENTIRELY in fluent, grammatically correct Marathi (मराठी) written in Devanagari script.
- The user may write in authentic Marathi (Devanagari script) OR in Romanized Marathi / Latin script / Hinglish / Maranglish (e.g., "maza credit score kasa improve karu?", "credit card bill kadhi bharayche?", "cibil score kasa check karaycha?").
- You MUST recognize Romanized Marathi queries, understand the user's intent, and respond ENTIRELY in authentic Marathi (मराठी) in Devanagari script.
- Do NOT respond in English or Latin alphabet under any circumstances unless the user explicitly asks: "Respond in English".
- Provide all 3 follow-up suggestions in Marathi (मराठी) in the format: [SUGGESTIONS: प्रश्न १ | प्रश्न २ | प्रश्न ३]
- Use natural Marathi financial terms (उदा. सिबिल स्कोर, क्रेडिट मर्यादा, ईएमआय, कर्ज नियोजन).
"""
    elif lang == "hi":
        lang_instructions = """
MANDATORY LANGUAGE INSTRUCTION (STRICT PRIORITY):
- The user has selected HINDI (हिंदी).
- You MUST respond ENTIRELY in fluent, grammatically correct Hindi (हिंदी) written in Devanagari script.
- The user may write in authentic Hindi (Devanagari script) OR in Romanized Hindi / Latin script / Hinglish (e.g., "mera credit score kaise improve karu?", "credit card bill kab bharna chahiye?", "cibil score kaise badhaye?").
- You MUST recognize Romanized Hindi queries, understand the user's intent, and respond ENTIRELY in authentic Hindi (हिंदी) in Devanagari script.
- Do NOT respond in English or Latin alphabet under any circumstances unless the user explicitly asks: "Respond in English".
- Provide all 3 follow-up suggestions in Hindi (हिंदी) in the format: [SUGGESTIONS: प्रश्न १ | प्रश्न २ | प्रश्न ३]
- Use natural Hindi financial terms (उदा. सिबिल स्कोर, क्रेडिट लिमिट, ईएमआई, ऋण प्रबंधन).
"""
    else:
        lang_instructions = """
MANDATORY LANGUAGE INSTRUCTION:
- The user has selected ENGLISH.
- Respond in clear, helpful, professional English.
- If the user types Romanized Hindi or Romanized Marathi, still explain the answer clearly and concisely in English.
- Provide all 3 follow-up suggestions in English in the format: [SUGGESTIONS: Question 1 | Question 2 | Question 3]
"""

    # -----------------------------------------------------
    # GEMINI PROMPT
    # -----------------------------------------------------
    prompt = f"""
You are Credit Assistant, a helpful AI financial & credit advisor for users in India.

{lang_instructions}

CURRENT DATE AND TIME:
Current date: {current_date}
Current time: {current_time}

IMPORTANT GUIDELINES:
- Answer general questions directly and clearly.
- For credit questions, use the supplied profile when relevant.
- NEVER invent or assume a credit score if one is not in the profile.
- If credit score is 'Not available', state that no score is recorded rather than guessing.
- Do not claim access to an official CIBIL bureau pull or live bureau database.
- Use Indian Rupees (₹) when discussing money.
- Use clean Markdown formatting.
- Keep answers concise, actionable, friendly, and professional.

USER CREDIT PROFILE:
{context}

PREVIOUS CONVERSATION:
{history_text}

USER'S LATEST QUESTION:
{user_message}

{lang_instructions}

Answer the user's question directly now. At the end, provide exactly three short follow-up questions using this format:
[SUGGESTIONS: question 1 | question 2 | question 3]
"""

    # -----------------------------------------------------
    # CALL GEMINI
    # -----------------------------------------------------
    text = call_gemini(prompt)

    if text:
        suggestions = []
        if "[SUGGESTIONS:" in text:
            parts = text.split("[SUGGESTIONS:", 1)
            main_text = parts[0].strip()
            suggestion_text = parts[1].replace("]", "").strip()
            suggestions = [
                item.strip()
                for item in suggestion_text.split("|")
                if item.strip()
            ]
            return {
                "response": main_text,
                "suggested_actions": suggestions[:3]
            }

        # Default fallback suggestions per language
        if lang == "mr":
            def_suggestions = [
                "CIBIL स्कोर कसा सुधारावा?",
                "क्रेडिट मर्यादा वाढवावी का?",
                "क्रेडिट कार्डचे बिल कधी भरावे?"
            ]
        elif lang == "hi":
            def_suggestions = [
                "सिबिल स्कोर कैसे सुधारें?",
                "क्रेडिट लिमिट कैसे बढ़ाएं?",
                "क्रेडिट कार्ड का बिल कब चुकाएं?"
            ]
        else:
            def_suggestions = [
                "How can I improve my credit score?",
                "How can I reduce credit utilization?",
                "How can I manage my loans better?"
            ]

        return {
            "response": text,
            "suggested_actions": def_suggestions
        }

    # -----------------------------------------------------
    # RULE-BASED FALLBACK (Guaranteed Multilingual)
    # -----------------------------------------------------
    return rule_based_chat_response(
        user_message,
        profile,
        language=lang
    )


# =========================================================
# RULE-BASED CHAT FALLBACK (Multilingual & Accurate)
# =========================================================

def rule_based_chat_response(
    user_message: str,
    profile,
    language: str = "en"
):
    score = getattr(profile, "credit_score", None)
    limit = getattr(profile, "credit_limit", 0.0) or 0.0
    balance = getattr(profile, "credit_card_balance", 0.0) or 0.0
    loans = getattr(profile, "active_loans", 0) or 0
    debt = getattr(profile, "total_debt", 0.0) or 0.0

    utilization = 0.0
    if limit > 0:
        utilization = round((balance / limit) * 100, 1)

    lowered = user_message.lower().strip()
    lang = (language or "en").lower().strip()

    is_mr = lang == "mr"
    is_hi = lang == "hi"

    # 1. GREETINGS
    greetings_words = ["hi", "hello", "hey", "namaste", "namaskar", "नमस्कार", "नमस्ते", "हॅलो", "हाय", "good morning", "good evening"]
    if any(lowered.startswith(w) or lowered == w for w in greetings_words):
        if is_mr:
            return {
                "response": (
                    "नमस्कार! 🙏 मी तुमचा **Credit Assistant** आर्थिक सहाय्यक आहे.\n\n"
                    "मी तुम्हाला खालील विषयांवर मार्गदर्शन करू शकतो:\n"
                    "- **CIBIL क्रेडिट स्कोर** वाढवण्याच्या पद्धती\n"
                    "- **क्रेडिट कार्ड वापर** (क्रेडिट युटिलायझेशन) ३०% च्या खाली ठेवणे\n"
                    "- **कर्ज व ईएमआय** नियोजन\n"
                    "- वेळेवर पेमेंट आणि आर्थिक उद्दिष्टे\n\n"
                    "तुम्हाला आज कशाबद्दल माहिती हवी आहे?"
                ),
                "suggested_actions": [
                    "CIBIL स्कोर कसा सुधारावा?",
                    "क्रेडिट युटिलायझेशन काय आहे?",
                    "कर्ज लवकर कसे फेडावे?"
                ]
            }
        elif is_hi:
            return {
                "response": (
                    "नमस्ते! 🙏 मैं आपका **Credit Assistant** वित्तीय सलाहकार हूँ।\n\n"
                    "मैं आपको इन महत्वपूर्ण विषयों में सहायता कर सकता हूँ:\n"
                    "- **सिबिल क्रेडिट स्कोर** सुधारने के सटीक उपाय\n"
                    "- **क्रेडिट कार्ड उपयोग** (यूटिलाइज़ेशन) को ३०% से कम रखना\n"
                    "- **ऋण और ईएमआई** का संतुलित प्रबंधन\n"
                    "- समय पर भुगतान और क्रेडिट इतिहास का निर्माण\n\n"
                    "आप आज किस विषय में जानकारी चाहते हैं?"
                ),
                "suggested_actions": [
                    "सिबिल स्कोर कैसे सुधारें?",
                    "क्रेडिट यूटिलाइज़ेशन क्या है?",
                    "कर्ज जल्दी कैसे चुकाएं?"
                ]
            }
        else:
            return {
                "response": (
                    "Hello! 👋 I am your **Credit Assistant** credit & financial advisor.\n\n"
                    "I can guide you on:\n"
                    "- Strategies to boost your **CIBIL credit score**\n"
                    "- Keeping **credit card utilization** under the safe 30% ceiling\n"
                    "- Balanced **loan & EMI management**\n"
                    "- On-time payment discipline and score simulator goals\n\n"
                    "What would you like assistance with today?"
                ),
                "suggested_actions": [
                    "How can I improve my credit score?",
                    "What is credit utilization?",
                    "How should I manage my loans?"
                ]
            }

    # 2. CREDIT UTILIZATION
    if any(w in lowered for w in ["utilization", "credit card", "limit", "card", "युटिलायझेशन", "मर्यादा", "यूटिलाइज़ेशन", "क्रेडिट कार्ड", "maryada", "seema", "kharch"]):
        if is_mr:
            return {
                "response": (
                    f"तुमचे सध्याचे क्रेडिट कार्ड युटिलायझेशन **{utilization}%** आहे.\n\n"
                    f"**CIBIL नियमानुसार महत्त्वाच्या गोष्टी:**\n"
                    f"- क्रेडिट कार्ड मर्यादेचा वापर नेहमी **३०% च्या खाली** ठेवावा.\n"
                    f"- जर बिल तारखेपूर्वीच पेमेंट केले, तर ब्युरोला कमी शिल्लक रिपोर्ट होते, ज्यामुळे स्कोर लवकर वाढतो.\n"
                    f"- कार्डची मर्यादा वाढल्यास तिचा गैरवापर न करता युटिलायझेशन रेशो कमी ठेवा.\n\n"
                    f"**सल्ला:** तुमचे बिल चक्र सुरू होण्यापूर्वी ५-७ दिवस आधी थकीत रक्कम भरा."
                ),
                "suggested_actions": [
                    "क्रेडिट युटिलायझेशन कसे कमी करावे?",
                    "बिल तारखेपूर्वी भरल्याने फायदा होतो का?",
                    "क्रेडिट मर्यादा वाढवावी का?"
                ]
            }
        elif is_hi:
            return {
                "response": (
                    f"आपका वर्तमान क्रेडिट कार्ड यूटिलाइज़ेशन **{utilization}%** है।\n\n"
                    f"**सिबिल दिशानिर्देशों के अनुसार प्रमुख बातें:**\n"
                    f"- क्रेडिट कार्ड लिमिट का उपयोग हमेशा **३०% से कम** रखना चाहिए।\n"
                    f"- यदि आप बिलिंग तिथि से पहले आंशिक भुगतान करते हैं, तो ब्यूरो को कम बैलेंस रिपोर्ट होता है।\n"
                    f"- बैंक से क्रेडिट लिमिट बढ़वाने पर आपका उपयोग अनुपात स्वाभाविक रूप से घट जाता है।\n\n"
                    f"**सुझाव:** अपने बिलिंग चक्र की कट-ऑफ तारीख से पहले अपने कार्ड का भुगतान करें।"
                ),
                "suggested_actions": [
                    "क्रेडिट यूटिलाइज़ेशन कैसे कम करें?",
                    "बिलिंग से पहले भुगतान का क्या लाभ है?",
                    "क्या क्रेडिट लिमिट बढ़वानी चाहिए?"
                ]
            }
        else:
            return {
                "response": (
                    f"Your current credit card utilization is **{utilization}%**.\n\n"
                    f"**Best practices for Indian CIBIL scoring:**\n"
                    f"- Always keep your revolving credit utilization **below 30%** of your total limit.\n"
                    f"- Paying off card balances before the statement generation date reports a lower balance to the credit bureaus.\n"
                    f"- Requesting an increased limit (without increasing spending) immediately improves this ratio."
                ),
                "suggested_actions": [
                    "How can I reduce utilization?",
                    "Does paying before the statement help?",
                    "Should I request a higher credit limit?"
                ]
            }

    # 3. CREDIT SCORE IMPROVEMENT
    if any(w in lowered for w in ["score", "improve", "boost", "increase", "cibil", "स्कोर", "सुधार", "वाढवणे", "बढ़ाना", "kasa", "kaise", "sudhar", "vadhva", "vadhvu", "badhaye", "badhana", "karnar", "karu", "kare", "karna"]):
        if is_mr:
            score_text = f"तुमचा सध्याचा नोंदवलेला CIBIL स्कोर **{score}** आहे." if score is not None else "तुमच्या खात्यात सध्या कोणताही स्कोअर **नोंदवलेला नाही**."
            return {
                "response": (
                    f"{score_text}\n\n"
                    f"**CIBIL स्कोर ७५०+ करण्यासाठी प्रमुख पायऱ्या:**\n"
                    f"1. **१००% वेळेवर परतफेड**: सर्व क्रेडिट कार्ड बिले आणि ईएमआय वेळेवर भरा (हा घटक स्कोअरच्या ३५% असतो).\n"
                    f"2. **कमी युटिलायझेशन**: कार्डच्या मर्यादेपैकी ३०% पेक्षा कमी वापरा.\n"
                    f"3. **अनावश्यक चौकशी टाळा**: एकाच वेळी अनेक बँकांकडे नवीन कर्जासाठी अर्ज करू नका.\n"
                    f"4. **क्रेडिट मिक्स**: सुरक्षित (गृह/वाहन कर्ज) आणि असुरक्षित (क्रेडिट कार्ड/वैयक्तिक कर्ज) यांचे निरोगी संतुलन ठेवा.\n"
                    f"5. **जुनी कार्डे चालू ठेवा**: क्रेडिट इतिहासाचे वय जेवढे जास्त, तेवढा स्कोअर मजबूत होतो."
                ),
                "suggested_actions": [
                    "स्कोर सुधारण्यासाठी किती वेळ लागतो?",
                    "CIBIL मध्ये ७५०+ स्कोर का महत्त्वाचा आहे?",
                    "माझे क्रेडिट कार्ड बंद करावे का?"
                ]
            }
        elif is_hi:
            score_text = f"आपका वर्तमान दर्ज सिबिल स्कोर **{score}** है।" if score is not None else "आपकी प्रोफाइल में फिलहाल कोई स्कोर **दर्ज नहीं है**।"
            return {
                "response": (
                    f"{score_text}\n\n"
                    f"**सिबिल स्कोर ७५०+ तक पहुंचाने के मुख्य उपाय:**\n"
                    f"1. **१००% समय पर भुगतान**: सभी ईएमआई और क्रेडिट कार्ड बिल नियत तारीख से पहले चुकाएं (यह स्कोर का ३५% हिस्सा है)।\n"
                    f"2. **कम यूटिलाइज़ेशन**: कुल क्रेडिट कार्ड लिमिट का ३०% से कम उपयोग करें।\n"
                    f"3. **हार्ड इन्क्वायरी से बचें**: कम समय में कई बैंकों में नए लोन या कार्ड के लिए आवेदन न करें।\n"
                    f"4. **क्रेडिट मिक्स**: सिक्योर्ड (होम/कार लोन) और अनसिक्योर्ड (क्रेडिट कार्ड/पर्सनल लोन) का अच्छा संतुलन रखें।\n"
                    f"5. **पुराने कार्ड चालू रखें**: क्रेडिट इतिहास जितना पुराना होगा, स्कोर उतना ही मजबूत होगा।"
                ),
                "suggested_actions": [
                    "स्कोर सुधारने में कितना समय लगता है?",
                    "सिबिल में ७५०+ स्कोर क्यों जरूरी है?",
                    "क्या पुराना क्रेडिट कार्ड बंद करना चाहिए?"
                ]
            }
        else:
            score_text = f"Your current recorded CIBIL score is **{score}**." if score is not None else "No credit score is currently **recorded** in your profile."
            return {
                "response": (
                    f"{score_text}\n\n"
                    f"**Key levers to reach a 750+ Prime CIBIL Score:**\n"
                    f"1. **Flawless Payment History**: On-time payments carry the highest weight (~35%) in scoring models.\n"
                    f"2. **Maintain Low Utilization**: Keep total card balance under 30% of aggregate limits.\n"
                    f"3. **Pace New Applications**: Avoid multiple loan/card inquiries in short intervals.\n"
                    f"4. **Balanced Credit Mix**: A blend of secured (auto/home) and revolving credit builds credibility.\n"
                    f"5. **Credit Age Longevity**: Keep your oldest credit card active to protect your average account age."
                ),
                "suggested_actions": [
                    "How long does score improvement take?",
                    "Why is 750+ considered prime in CIBIL?",
                    "Should I close my unused credit card?"
                ]
            }

    # 4. LOANS & EMIS
    if any(w in lowered for w in ["loan", "emi", "debt", "कर्ज", "ऋण", "हप्ता", "व्याज", "karj", "karja", "karza", "feda", "chukavne", "chukaye", "hafta", "vyaj", "byaj"]):
        if is_mr:
            return {
                "response": (
                    f"तुमच्या खात्यावर सध्या **{loans} सक्रिय कर्ज(े)** नोंदवली असून एकूण कर्ज **₹{debt:,.2f}** आहे.\n\n"
                    f"**कर्ज व्यवस्थापनासाठी स्मार्ट धोरण:**\n"
                    f"- उच्च व्याजदराची कर्जे (उदा. वैयक्तिक कर्ज किंवा क्रेडिट कार्ड थकीत) प्रथम फेडा.\n"
                    f"- ईएमआय चुकणे टाळण्यासाठी बँकेत ऑटो-डेबिट (NACH) सक्रिय ठेवा.\n"
                    f"- उत्पन्नाच्या ४०% पेक्षा जास्त ईएमआय होणार नाही याची काळजी घ्या (सुरक्षित DTI प्रमाण)."
                ),
                "suggested_actions": [
                    "कर्ज लवकर फेडल्याने स्कोअर सुधारतो का?",
                    "DTI प्रमाण किती असावे?",
                    "ऑटो-डेबिट कसे सेट करावे?"
                ]
            }
        elif is_hi:
            return {
                "response": (
                    f"आपकी प्रोफाइल में **{loans} सक्रिय ऋण** दर्ज हैं और कुल बकाया राशि **₹{debt:,.2f}** है।\n\n"
                    f"**ऋण प्रबंधन के स्मार्ट नियम:**\n"
                    f"- उच्च ब्याज वाले ऋण (जैसे पर्सनल लोन या क्रेडिट कार्ड बकाया) पहले चुकाएं।\n"
                    f"- ईएमआई बाउंस से बचने के लिए खाते में ऑटो-डेबिट (NACH) सक्षम रखें।\n"
                    f"- कुल ईएमआई को अपनी मासिक आय के ४०% से कम रखें (सुरक्षित डीटीआई अनुपात)।"
                ),
                "suggested_actions": [
                    "क्या समय पूर्व ऋण चुकाने से सिबिल सुधरता है?",
                    "सुरक्षित डीटीआई अनुपात क्या है?",
                    "ईएमआई बाउंस के क्या नुकसान हैं?"
                ]
            }
        else:
            return {
                "response": (
                    f"You have **{loans} active loan(s)** recorded with total debt of **₹{debt:,.2f}**.\n\n"
                    f"**Smart Debt Management Principles:**\n"
                    f"- Prioritize clearing high-interest obligations first (avalanche method).\n"
                    f"- Keep debt-to-income (DTI) below 40% to remain attractive for prime bank lending.\n"
                    f"- Always ensure bank auto-debit (NACH) is active to prevent accidental payment misses."
                ),
                "suggested_actions": [
                    "Does early loan prepayment help CIBIL?",
                    "What is a safe Debt-to-Income ratio?",
                    "What happens if an EMI is missed?"
                ]
            }

    # 5. GENERAL / CIBIL OVERVIEW (Default Multilingual Fallback)
    if is_mr:
        return {
            "response": (
                f"मी **Credit Assistant** आहे. तुम्ही विचारलेल्या प्रश्नाबद्दल:\n\n"
                f"भारतामध्ये CIBIL स्कोर ३०० ते ९०० दरम्यान मोजला जातो. ७५० पेक्षा जास्त स्कोअर असलेल्या ग्राहकांना बँका सर्वात कमी व्याजदरावर आणि त्वरित कर्ज मंजूर करतात.\n\n"
                f"**महत्त्वाच्या आर्थिक टिप्स:**\n"
                f"- सर्व क्रेडिट कार्ड आणि कर्जाचे हफ्ते वेळेवर भरा.\n"
                f"- क्रेडिट कार्डचा वापर मर्यादेच्या ३०% पेक्षा कमी ठेवा.\n"
                f"- वर्षातून किमान एकदा आपला अधिकृत सिबिल रिपोर्ट तपासून पाहा.\n\n"
                f"तुम्हाला CIBIL स्कोर, क्रेडिट कार्ड, किंवा कर्ज यांपैकी कोणत्या विषयावर अधिक माहिती हवी आहे?"
            ),
            "suggested_actions": [
                "CIBIL स्कोर कसा सुधारावा?",
                "क्रेडिट कार्ड वापर कसा कमी करावा?",
                "कर्जासाठी पात्रता कशी वाढवावी?"
            ]
        }
    elif is_hi:
        return {
            "response": (
                f"मैं **Credit Assistant** हूँ। आपके प्रश्न के संबंध में:\n\n"
                f"भारत में सिबिल स्कोर ३०० से ९०० के बीच आंका जाता है। ७५० से अधिक स्कोर होने पर बैंक सबसे कम ब्याज दरों पर और बिना किसी परेशानी के तुरंत लोन स्वीकृत करते हैं।\n\n"
                f"**महत्वपूर्ण वित्तीय सुझाव:**\n"
                f"- सभी ईएमआई और क्रेडिट कार्ड बिल समय पर चुकाएं।\n"
                f"- क्रेडिट लिमिट का उपयोग ३०% से कम रखें।\n"
                f"- साल में कम से कम एक बार अपनी क्रेडिट रिपोर्ट की समीक्षा करें।\n\n"
                f"आप सिबिल स्कोर, क्रेडिट कार्ड या लोन के बारे में क्या जानना चाहते हैं?"
            ),
            "suggested_actions": [
                "सिबिल स्कोर कैसे सुधारें?",
                "क्रेडिट कार्ड यूटिलाइज़ेशन कैसे घटाएं?",
                "लोन पात्रता कैसे बढ़ाएं?"
            ]
        }
    else:
        return {
            "response": (
                f"I am **Credit Assistant**, your Indian credit & financial advisory assistant.\n\n"
                f"In India, CIBIL scores range from 300 to 900. Maintaining a score of **750+** qualifies you for the lowest loan interest rates and swift pre-approvals across major banks.\n\n"
                f"**Top financial health habits:**\n"
                f"- Maintain 100% on-time payment track record across all accounts.\n"
                f"- Keep revolving credit utilization under 30%.\n"
                f"- Review credit tradelines regularly for reporting discrepancies.\n\n"
                f"What specific area of your credit would you like to discuss?"
            ),
            "suggested_actions": [
                "How can I improve my credit score?",
                "How can I reduce credit utilization?",
                "How to boost loan eligibility?"
            ]
        }


# =========================================================
# AI RECOMMENDATIONS
# =========================================================

def generate_ai_recommendations(
    profile,
    accounts=None
) -> dict:

    context = get_cibil_context(
        profile,
        accounts
    )

    prompt = f"""
You are an educational credit-health assistant for India.

Analyze the following profile.

Return ONLY valid JSON with exactly these fields:

{{
  "summary": "short summary",
  "cibil_health_status": "Excellent",
  "strengths": ["strength 1"],
  "risk_factors": ["risk 1"],
  "actionable_steps": ["step 1", "step 2"],
  "target_score_projection": "Educational range only; no guarantee"
}}

Do not claim this is an official CIBIL report.

User profile:

{context}
"""

    text = call_gemini(prompt)

    data = extract_json(text)

    if data:
        return data

    return rule_based_recommendations(
        profile
    )


# =========================================================
# RULE-BASED RECOMMENDATIONS (Accurate, No Assumed Scores)
# =========================================================

def rule_based_recommendations(profile):

    score = (
        profile.credit_score
        if profile and profile.credit_score is not None
        else None
    )

    utilization = 0.0

    if profile and profile.credit_limit > 0:
        utilization = round(
            (
                profile.credit_card_balance /
                profile.credit_limit
            ) * 100,
            1
        )

    missed = (
        profile.missed_payments
        if profile
        else 0
    )

    if score is not None:
        if score >= 750:
            health = "Excellent"
        elif score >= 700:
            health = "Good"
        elif score >= 650:
            health = "Fair"
        else:
            health = "Needs Attention"
    else:
        health = "Not Assessed"

    strengths = []
    risks = []
    actions = []

    if score is not None:
        if score >= 700:
            strengths.append(
                "Recorded credit score is in a relatively strong range."
            )
        else:
            risks.append(
                "Recorded credit score indicates room for improvement."
            )
    else:
        actions.append(
            "Record your credit score snapshot in Score History to enable score-tier recommendations."
        )

    if missed == 0:
        strengths.append(
            "No missed payments are recorded in the profile."
        )
    else:
        risks.append(
            f"{missed} missed payment(s) are recorded."
        )
        actions.append(
            "Prioritize making all future payments on time."
        )

    if utilization <= 30:
        strengths.append(
            f"Recorded credit utilization is {utilization}%."
        )
    else:
        risks.append(
            f"Credit utilization is relatively high at {utilization}%."
        )
        actions.append(
            "Work toward reducing revolving credit utilization below 30%."
        )

    actions.append(
        "Monitor your credit profile regularly."
    )
    actions.append(
        "Avoid unnecessary hard credit inquiries or loan applications."
    )

    if score is not None:
        summary_msg = (
            f"Your recorded credit profile is currently assessed as '{health}' "
            f"with a score of {score}."
        )
    else:
        summary_msg = (
            f"Your credit profile is evaluated as '{health}' (no score recorded). "
            f"Credit utilization is {utilization}% with {missed} missed payment(s) recorded."
        )

    return {
        "summary": summary_msg,
        "cibil_health_status": health,
        "strengths": strengths or ["Basic credit profile data is available."],
        "risk_factors": risks or [
            "No major immediate risks identified from the supplied data."
        ],
        "actionable_steps": actions,
        "target_score_projection": (
            "Future score cannot be guaranteed; focus on consistent healthy credit behavior."
        )
    }


# =========================================================
# AI CREDIT ANALYSIS
# =========================================================

def generate_ai_credit_analysis(
    profile,
    accounts=None,
    payments=None
) -> dict:

    context = get_cibil_context(
        profile,
        accounts
    )

    disclaimer = (
        "Educational credit analysis based strictly on user-supplied information in Credit Assistant. "
        "This does not access or pull an official credit bureau report from TransUnion CIBIL or other credit bureaus."
    )

    prompt = f"""
You are an educational credit-risk assistant for India.

Analyze this user's credit profile.

Return ONLY valid JSON:

{{
  "cibil_health_score": null,
  "health_grade": "Good",
  "summary": "short analysis",
  "key_positive_factors": ["factor 1"],
  "critical_risk_factors": ["risk 1"],
  "immediate_action_items": ["action 1"],
  "long_term_strategy": ["strategy 1"],
  "educational_disclaimer": "{disclaimer}"
}}

Use the user's recorded score if available. If none exists, keep cibil_health_score as null.
Do not assume or invent a default credit score like 700 or 720.
Do not guarantee future score changes.
Do not claim access to an official CIBIL bureau pull or real-time bureau data.

User context:
{context}
"""

    text = call_gemini(prompt)

    data = extract_json(text)

    if data:
        data["educational_disclaimer"] = disclaimer
        return data

    return rule_based_analysis(
        profile,
        disclaimer
    )


# =========================================================
# RULE-BASED CREDIT ANALYSIS (Accurate, Safe)
# =========================================================

def rule_based_analysis(
    profile,
    disclaimer
):

    score = (
        profile.credit_score
        if profile and profile.credit_score is not None
        else None
    )

    utilization = 0.0

    if profile and profile.credit_limit > 0:
        utilization = round(
            (
                profile.credit_card_balance /
                profile.credit_limit
            ) * 100,
            1
        )

    missed = (
        profile.missed_payments
        if profile
        else 0
    )

    if score is not None:
        if score >= 750:
            grade = "Excellent"
        elif score >= 700:
            grade = "Good"
        elif score >= 650:
            grade = "Fair"
        else:
            grade = "Needs Attention"
    else:
        grade = "Not Assessed"

    positives = []
    risks = []
    actions = []

    if missed == 0:
        positives.append(
            "No missed payments are recorded."
        )
    else:
        risks.append(
            f"{missed} missed payment(s) are recorded."
        )
        actions.append(
            "Make all future payments on time."
        )

    if utilization <= 30:
        positives.append(
            f"Credit utilization is {utilization}%."
        )
    else:
        risks.append(
            f"Credit utilization is {utilization}%."
        )
        actions.append(
            "Reduce revolving credit utilization below 30%."
        )

    if score is None:
        actions.append(
            "Record your credit score in Profile or Score History to receive personalized score grade analysis."
        )
        summary_text = (
            f"Your credit profile has not recorded a credit score yet. "
            f"Credit utilization is {utilization}% and {missed} missed payment(s) are recorded."
        )
    else:
        summary_text = (
            f"Your recorded credit profile is assessed as '{grade}' with a score of {score}. "
            f"Credit utilization is {utilization}% and {missed} missed payment(s) are recorded."
        )

    return {
        "cibil_health_score": score,
        "health_grade": grade,
        "summary": summary_text,
        "key_positive_factors": positives or [
            "Basic credit profile information is available."
        ],
        "critical_risk_factors": risks or [
            "No major immediate risks identified."
        ],
        "immediate_action_items": actions or [
            "Continue making payments on time."
        ],
        "long_term_strategy": [
            "Maintain consistent payment behavior across all accounts.",
            "Keep credit card utilization well below 30%.",
            "Avoid submitting multiple hard credit inquiries in a short timeframe."
        ],
        "educational_disclaimer": disclaimer
    }






