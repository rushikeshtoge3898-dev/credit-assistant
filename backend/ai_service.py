import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

client = None

if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Failed to initialize Gemini: {e}")


# =========================================================
# CREDIT PROFILE CONTEXT
# =========================================================

def get_cibil_context(profile, accounts=None):
    if not profile:
        return "No credit profile available yet."

    utilization = 0.0

    if profile.credit_limit and profile.credit_limit > 0:
        utilization = round(
            (profile.credit_card_balance / profile.credit_limit) * 100,
            2
        )

    dti = 0.0

    if profile.monthly_income and profile.monthly_income > 0:
        dti = round(
            (profile.total_debt / (profile.monthly_income * 12)) * 100,
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

    return f"""
Current User Credit & Financial Profile

Country: India
Credit context: CIBIL-oriented educational analysis

- Credit Score: {profile.credit_score if profile.credit_score else 'Not available'}
- Monthly Income: ₹{profile.monthly_income:,.2f}
- Total Debt: ₹{profile.total_debt:,.2f}
- Total Credit Card Limit: ₹{profile.credit_limit:,.2f}
- Outstanding Credit Card Balance: ₹{profile.credit_card_balance:,.2f}
- Credit Utilization: {utilization}%
- Debt-to-Income Ratio: {dti}%
- Active Loans: {profile.active_loans}
- Missed / Overdue Payments: {profile.missed_payments}
- Financial Goal: {profile.financial_goal or 'Improve overall credit profile'}

Active Accounts:
{accounts_str}
"""


# =========================================================
# GEMINI API
# =========================================================

def call_gemini(prompt):
    if not client:
        return None

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )

        if response and response.text:
            return response.text.strip()

    except Exception as e:
        print(f"Gemini API error: {e}")

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
# AI CHATBOT
# =========================================================

def generate_ai_chat_response(
    user_message: str,
    profile,
    accounts=None,
    chat_history=None,
    language: str = "en"
) -> dict:

    context = get_cibil_context(profile, accounts)

    # -----------------------------------------------------
    # CURRENT DATE
    # -----------------------------------------------------

    india_now = datetime.now(ZoneInfo("Asia/Kolkata"))

    current_date = india_now.strftime("%A, %d %B %Y")
    current_time = india_now.strftime("%I:%M %p")

    # -----------------------------------------------------
    # HANDLE DATE QUESTIONS DIRECTLY (Multilingual)
    # -----------------------------------------------------

    lowered_message = user_message.lower().strip()
    lang = (language or "en").lower()

    date_questions_en = [
        "today's date",
        "todays date",
        "current date",
        "what date is it",
        "what is the date today",
        "what's the date today",
        "today date"
    ]
    date_questions_mr = [
        "आजची तारीख",
        "आजची तारीख काय आहे",
        "तारीख काय आहे",
        "आज किती तारीख आहे",
        "आजचा दिनांक"
    ]
    date_questions_hi = [
        "आज क्या तारीख है",
        "आज की तारीख",
        "तारीख क्या है",
        "आज कितनी तारीख है",
        "आज का दिनांक"
    ]

    is_mr_date = any(q in lowered_message for q in date_questions_mr)
    is_hi_date = any(q in lowered_message for q in date_questions_hi)
    is_en_date = any(q in lowered_message for q in date_questions_en)

    if is_mr_date or (lang == "mr" and is_en_date):
        return {
            "response": f"आजची तारीख **{current_date}** आहे.",
            "suggested_actions": [
                "CIBIL स्कोर कसा सुधारावा?",
                "क्रेडिट युटिलायझेशन काय आहे?",
                "कर्ज व्यवस्थापन कसे करावे?"
            ]
        }
    elif is_hi_date or (lang == "hi" and is_en_date):
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
            history_text += (
                f"{message.role}: {message.content}\n"
            )

    # -----------------------------------------------------
    # LANGUAGE INSTRUCTIONS FOR GEMINI
    # -----------------------------------------------------
    lang_instructions = ""
    if lang == "mr":
        lang_instructions = """
LANGUAGE REQUIREMENT (STRICT):
- The user's interface language is MARATHI (मराठी).
- You MUST respond in fluent, grammatically correct Marathi (मराठी).
- If the user writes in Marathi, respond in Marathi.
- Provide all follow-up suggestions in Marathi in the [SUGGESTIONS: प्रश्न १ | प्रश्न २ | प्रश्न ३] format.
- Keep Indian financial terms natural (उदा. सिबिल स्कोर, क्रेडिट मर्यादा, ईएमआय).
"""
    elif lang == "hi":
        lang_instructions = """
LANGUAGE REQUIREMENT (STRICT):
- The user's interface language is HINDI (हिंदी).
- You MUST respond in fluent, grammatically correct Hindi (हिंदी).
- If the user writes in Hindi, respond in Hindi.
- Provide all follow-up suggestions in Hindi in the [SUGGESTIONS: प्रश्न १ | प्रश्न २ | प्रश्न ३] format.
- Keep Indian financial terms natural (उदा. सिबिल स्कोर, क्रेडिट लिमिट, ईएमआई).
"""
    else:
        lang_instructions = """
LANGUAGE REQUIREMENT:
- If the user asks in Marathi, respond in Marathi (मराठी).
- If the user asks in Hindi, respond in Hindi (हिंदी).
- If the user asks in English, respond in English.
- Always provide the follow-up suggestions in the same language as your response.
"""

    # -----------------------------------------------------
    # GEMINI PROMPT
    # -----------------------------------------------------

    prompt = f"""
You are CreditGenius, a helpful AI assistant inside a
credit-health application for users in India.

You can answer BOTH:
1. General questions normally, like a general AI assistant.
2. Credit and financial-health questions using the user's
   supplied profile when relevant.

CURRENT DATE AND TIME:
Current date: {current_date}
Current time: {current_time}

IMPORTANT GUIDELINES:
{lang_instructions}
- If the user asks about today's date, use the current date provided above.
- Answer general questions normally without forcing credit advice if not asked.
- If the user asks about programming, technology, education, mathematics, general knowledge, etc., answer normally.
- For credit questions, use the supplied profile when useful.
- NEVER invent or assume a credit score if one is not in the profile.
- If credit score is 'Not available', state that no score is recorded rather than guessing.
- Do not claim access to an official CIBIL bureau pull or real-time credit bureau report.
- Do not claim to know bank or bureau data unless it appears in the supplied profile.
- Do not guarantee a future credit score.
- Avoid personalized high-risk financial decisions.
- Use Indian Rupees (₹) when discussing Indian money.
- Use simple Markdown formatting.
- Keep answers concise, actionable, friendly, and professional.

USER CREDIT PROFILE:
{context}

PREVIOUS CONVERSATION:
{history_text}

USER'S LATEST QUESTION:
{user_message}

Answer the user's question directly.
Do not unnecessarily mention the user's credit profile if the question is unrelated to credit.

At the end, provide exactly three short follow-up questions using this format:
[SUGGESTIONS: question 1 | question 2 | question 3]
"""

    # -----------------------------------------------------
    # CALL GEMINI
    # -----------------------------------------------------

    text = call_gemini(prompt)

    if text:

        suggestions = []

        if "[SUGGESTIONS:" in text:

            parts = text.split(
                "[SUGGESTIONS:",
                1
            )

            main_text = parts[0].strip()

            suggestion_text = parts[1]

            suggestion_text = (
                suggestion_text
                .replace("]", "")
                .strip()
            )

            suggestions = [
                item.strip()
                for item in suggestion_text.split("|")
                if item.strip()
            ]

            return {
                "response": main_text,
                "suggested_actions": suggestions[:3]
            }

        return {
            "response": text,
            "suggested_actions": [
                "How can I improve my credit score?",
                "How can I reduce credit utilization?",
                "How can I manage my loans better?"
            ]
        }

    # -----------------------------------------------------
    # FALLBACK
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

    score = profile.credit_score if profile and profile.credit_score is not None else None

    utilization = 0.0

    if profile and profile.credit_limit > 0:
        utilization = round(
            (
                profile.credit_card_balance /
                profile.credit_limit
            ) * 100,
            1
        )

    lowered = user_message.lower()
    lang = (language or "en").lower()

    # Detect Devanagari / Marathi / Hindi keywords in message
    is_mr = lang == "mr" or any(w in lowered for w in ["तारीख", "स्कोर", "कर्ज", "क्रेडिट", "मर्यादा"])
    is_hi = lang == "hi" or any(w in lowered for w in ["तारीख", "स्कोर", "ऋण", "क्रेडिट", "ब्याज"])

    # -----------------------------------------------------
    # CREDIT UTILIZATION
    # -----------------------------------------------------
    if (
        "utilization" in lowered
        or "credit card" in lowered
        or "limit" in lowered
        or "क्रेडिट" in lowered
        or "मर्यादा" in lowered
        or "युटिलायझेशन" in lowered
        or "यूटिलाइज़ेशन" in lowered
    ):
        if is_mr:
            response = (
                f"तुमचे सध्याचे क्रेडिट युटिलायझेशन **{utilization}%** आहे.\n\n"
                f"क्रेडिट युटिलायझेशन ३०% पेक्षा कमी ठेवल्याने CIBIL स्कोर निरोगी राहण्यास मदत होते.\n\n"
                f"**शिफारस केलेल्या कृती:**\n"
                f"- क्रेडिट कार्डची बिले वेळेवर भरा.\n"
                f"- उपलब्ध मर्यादेचा जास्त वापर टाळा.\n"
                f"- केवळ मर्यादा वाढवण्यासाठी अनावश्यक नवीन कार्ड घेणे टाळा."
            )
            suggestions = [
                "क्रेडिट युटिलायझेशन कसे कमी करावे?",
                "बिल तारखेपूर्वी भरल्याने फायदा होतो का?",
                "क्रेडिट मर्यादा वाढवावी का?"
            ]
        elif is_hi:
            response = (
                f"आपका वर्तमान क्रेडिट यूटिलाइज़ेशन **{utilization}%** है।\n\n"
                f"क्रेडिट यूटिलाइज़ेशन को ३०% से नीचे रखना सिबिल स्कोर को स्वस्थ रखने में मदद करता है।\n\n"
                f"**सुझाए गए कदम:**\n"
                f"- क्रेडिट कार्ड के बिल समय पर चुकाएं।\n"
                f"- उपलब्ध लिमिट का अत्यधिक उपयोग करने से बचें।\n"
                f"- केवल लिमिट बढ़ाने के लिए अनावश्यक नए कार्ड न लें।"
            )
            suggestions = [
                "क्रेडिट यूटिलाइज़ेशन कैसे कम करें?",
                "बिलिंग से पहले भुगतान का क्या लाभ है?",
                "क्या क्रेडिट लिमिट बढ़वानी चाहिए?"
            ]
        else:
            response = (
                f"Your current credit utilization is **{utilization}%**.\n\n"
                f"Keeping credit utilization relatively low (under 30%) can help maintain a healthier credit profile.\n\n"
                f"**Suggested actions:**\n"
                f"- Avoid unnecessarily using most of your available limit.\n"
                f"- Pay credit-card bills on time before the billing cycle cut-off.\n"
                f"- Avoid opening unnecessary new credit tradelines simply to stretch your limit."
            )
            suggestions = [
                "How can I reduce utilization?",
                "Does paying before the statement help?",
                "Should I request a higher credit limit?"
            ]

    # -----------------------------------------------------
    # CREDIT SCORE
    # -----------------------------------------------------
    elif (
        "score" in lowered
        or "improve" in lowered
        or "boost" in lowered
        or "cibil" in lowered
        or "सिबिल" in lowered
        or "सुधार" in lowered
    ):
        if is_mr:
            if score is not None:
                response = (
                    f"तुमचा सध्या नोंदवलेला CIBIL क्रेडिट स्कोर **{score}** आहे.\n\n"
                    f"क्रेडिट प्रोफाइल सुधारण्यासाठी:\n"
                    f"- प्रत्येक पेमेंट वेळेवर करा.\n"
                    f"- क्रेडिट युटिलायझेशन ३०% च्या खाली ठेवा.\n"
                    f"- एकाच वेळी अनेक कर्जांसाठी अर्ज करणे टाळा.\n"
                    f"- दीर्घकालीन निरोगी क्रेडिट इतिहास टिकवून ठेवा."
                )
            else:
                response = (
                    "तुमच्या प्रोफाइलमध्ये सध्या कोणताही क्रेडिट स्कोर **उपलब्ध नाही**.\n\n"
                    "वैयक्तिकृत सल्ल्यासाठी कृपया प्रोफाइल किंवा स्कोअर इतिहासामध्ये तुमचा स्कोअर जोडा.\n\n"
                    "**निरोगी क्रेडिट तयार करण्याचे मार्ग:**\n"
                    "- सर्व ईएमआय आणि बिले वेळेवर भरा.\n"
                    "- क्रेडिट कार्डचा वापर ३०% पेक्षा कमी ठेवा.\n"
                    "- अनावश्यक क्रेडिट अर्ज टाळा."
                )
            suggestions = [
                "स्कोर सुधारण्यासाठी किती वेळ लागतो?",
                "क्रेडिट स्कोरवर कशाचा परिणाम होतो?",
                "वेळेवर पेमेंट कसे सुनिश्चित करावे?"
            ]
        elif is_hi:
            if score is not None:
                response = (
                    f"आपका वर्तमान दर्ज सिबिल क्रेडिट स्कोर **{score}** है।\n\n"
                    f"क्रेडिट प्रोफाइल सुधारने के लिए:\n"
                    f"- प्रत्येक भुगतान समय पर करें।\n"
                    f"- क्रेडिट यूटिलाइज़ेशन ३०% से कम रखें।\n"
                    f"- अनावश्यक ऋण आवेदनों से बचें।\n"
                    f"- दीर्घकालिक स्वस्थ क्रेडिट इतिहास बनाए रखें।"
                )
            else:
                response = (
                    "आपकी प्रोफाइल में फिलहाल कोई क्रेडिट स्कोर **दर्ज नहीं है**।\n\n"
                    "सटीक मार्गदर्शन के लिए कृपया स्कोर हिस्ट्री या प्रोफाइल में अपना स्कोर दर्ज करें।\n\n"
                    "**स्वस्थ क्रेडिट बनाने के सुझाव:**\n"
                    "- समय पर ईएमआई और बिल चुकाएं।\n"
                    "- क्रेडिट लिमिट का ३०% से कम उपयोग करें।\n"
                    "- अनावश्यक लोन आवेदन न करें।"
                )
            suggestions = [
                "स्कोर सुधारने में कितना समय लगता है?",
                "क्रेडिट स्कोर को क्या प्रभावित करता है?",
                "ईएमआई समय पर कैसे रखें?"
            ]
        else:
            if score is not None:
                response = (
                    f"Your current recorded credit score is **{score}**.\n\n"
                    f"To work toward a healthier credit profile:\n"
                    f"- Make every payment on time (35% factor).\n"
                    f"- Keep revolving credit utilization under 30%.\n"
                    f"- Avoid submitting multiple hard credit inquiries in short succession.\n"
                    f"- Maintain a healthy credit mix and established credit age."
                )
            else:
                response = (
                    "Your credit score is currently **not available** in your profile.\n\n"
                    "Please record your initial score in Profile or Score History to receive personalized tier analysis.\n\n"
                    "**Fundamental habits to build a strong credit profile:**\n"
                    "- Make every payment on time.\n"
                    "- Keep card utilization below 30% of your total limit.\n"
                    "- Avoid opening too many new loans simultaneously."
                )
            suggestions = [
                "How long does score improvement take?",
                "What affects an Indian CIBIL score?",
                "How can I avoid missed payments?"
            ]

    # -----------------------------------------------------
    # LOANS / EMI
    # -----------------------------------------------------
    elif (
        "loan" in lowered
        or "emi" in lowered
        or "debt" in lowered
        or "कर्ज" in lowered
        or "ऋण" in lowered
        or "ईएमआय" in lowered
        or "ईएमआई" in lowered
    ):
        loans = profile.active_loans if profile else 0
        debt = profile.total_debt if profile else 0

        if is_mr:
            response = (
                f"तुमच्या प्रोफाइलवर सध्या **{loans} सक्रिय कर्ज(े)** नोंदवली आहेत, "
                f"आणि एकूण कर्ज **₹{debt:,.2f}** आहे.\n\n"
                f"ईएमआय वेळेवर भरण्यावर लक्ष केंद्रित करा आणि अनावश्यक अतिरिक्त कर्ज घेणे टाळा."
            )
            suggestions = [
                "कर्ज परतफेडीचा स्कोरवर कसा परिणाम होतो?",
                "योग्य कर्ज स्तर कोणता आहे?",
                "कर्ज लवकर फेडावे का?"
            ]
        elif is_hi:
            response = (
                f"आपकी प्रोफाइल में वर्तमान में **{loans} सक्रिय ऋण** दर्ज हैं, "
                f"और कुल ऋण **₹{debt:,.2f}** है।\n\n"
                f"समय पर ईएमआई चुकाने पर ध्यान दें और अनावश्यक अतिरिक्त कर्ज लेने से बचें।"
            )
            suggestions = [
                "ऋण पुनर्भुगतान स्कोर को कैसे प्रभावित करता है?",
                "स्वस्थ ऋण स्तर क्या है?",
                "क्या समय से पहले ऋण चुकाना चाहिए?"
            ]
        else:
            response = (
                f"You currently have **{loans} active loan(s)** recorded in your profile, "
                f"with total debt of **₹{debt:,.2f}**.\n\n"
                f"Focus on making EMIs on time and avoid taking on unnecessary additional debt."
            )
            suggestions = [
                "How does loan repayment affect credit?",
                "What is a healthy debt level?",
                "Should I repay a loan early?"
            ]

    # -----------------------------------------------------
    # GENERAL FALLBACK
    # -----------------------------------------------------
    else:
        if is_mr:
            response = (
                "नमस्कार! 👋 मी तुमचा **CreditGenius** आर्थिक सल्लागार आहे.\n\n"
                "मी तुम्हाला पुढील विषयांवर मदत करू शकतो:\n"
                "- CIBIL क्रेडिट स्कोर सुधारणा\n"
                "- क्रेडिट कार्ड युटिलायझेशन व्यवस्थापन\n"
                "- कर्ज आणि ईएमआय नियोजन\n"
                "- देयके आणि आर्थिक उद्दिष्टे"
            )
            suggestions = [
                "माझे क्रेडिट आरोग्य तपासा",
                "माझा स्कोर कसा वाढवू?",
                "कर्ज कसे कमी करावे?"
            ]
        elif is_hi:
            response = (
                "नमस्ते! 👋 मैं आपका **CreditGenius** वित्तीय सहायक हूँ।\n\n"
                "मैं इन विषयों में आपकी सहायता कर सकता हूँ:\n"
                "- सिबिल क्रेडिट स्कोर सुधार\n"
                "- क्रेडिट कार्ड यूटिलाइज़ेशन प्रबंधन\n"
                "- ऋण और ईएमआई योजना\n"
                "- भुगतान और वित्तीय लक्ष्य"
            )
            suggestions = [
                "मेरा क्रेडिट स्वास्थ्य विश्लेषित करें",
                "स्कोर कैसे सुधारें?",
                "कर्ज कैसे कम करें?"
            ]
        else:
            response = (
                "Hello! 👋 I'm your **CreditGenius** assistant.\n\n"
                "I can help you with:\n"
                "- CIBIL credit score improvement\n"
                "- Credit card utilization\n"
                "- Loans and EMI planning\n"
                "- Missed payments and debt reduction\n"
                "- Credit-health optimization"
            )
            suggestions = [
                "Analyze my credit health",
                "How can I improve my score?",
                "How can I reduce my debt?"
            ]

    return {
        "response": response,
        "suggested_actions": suggestions
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






