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
    chat_history=None
) -> dict:

    context = get_cibil_context(profile, accounts)

        # -----------------------------------------------------
    # CURRENT DATE
    # -----------------------------------------------------

    india_now = datetime.now(ZoneInfo("Asia/Kolkata"))

    current_date = india_now.strftime("%A, %d %B %Y")
    current_time = india_now.strftime("%I:%M %p")
    # -----------------------------------------------------
    # HANDLE DATE QUESTIONS DIRECTLY
    # -----------------------------------------------------

    lowered_message = user_message.lower().strip()

    date_questions = [
        "today's date",
        "todays date",
        "current date",
        "what date is it",
        "what is the date today",
        "what's the date today",
        "today date"
    ]

    if any(question in lowered_message for question in date_questions):

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

IMPORTANT:

- If the user asks about today's date, use the current date
  provided above.
- Answer general questions normally.
- Do NOT redirect every question toward credit.
- If the user asks about programming, technology, education,
  mathematics, general knowledge, etc., answer normally.
- For credit questions, use the supplied profile when useful.
- Do not claim access to the user's official CIBIL report.
- Do not claim to know bank or bureau data unless it appears
  in the supplied profile.
- Do not guarantee a future credit score.
- Avoid personalized high-risk financial decisions.
- Use Indian Rupees (₹) when discussing Indian money.
- Use simple Markdown.
- Keep answers concise but useful.
- Give practical steps whenever appropriate.
- Be friendly and professional.

USER CREDIT PROFILE:

{context}

PREVIOUS CONVERSATION:

{history_text}

USER'S LATEST QUESTION:

{user_message}

Answer the user's question directly.

Do not unnecessarily mention the user's credit profile if the
question is unrelated to credit.

At the end, provide exactly three short follow-up questions
using this format:

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
        profile
    )


# =========================================================
# RULE-BASED CHAT FALLBACK
# =========================================================

def rule_based_chat_response(
    user_message,
    profile
):

    score = (
        profile.credit_score
        if profile and profile.credit_score
        else 700
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

    lowered = user_message.lower()

    # -----------------------------------------------------
    # CREDIT UTILIZATION
    # -----------------------------------------------------

    if (
        "utilization" in lowered
        or "credit card" in lowered
        or "limit" in lowered
    ):

        response = (
            f"Your current credit utilization is "
            f"**{utilization}%**.\n\n"

            f"Keeping credit utilization relatively low "
            f"can help maintain a healthier credit profile.\n\n"

            f"**Suggested actions:**\n"
            f"- Avoid unnecessarily using most of your available limit.\n"
            f"- Pay credit-card bills on time.\n"
            f"- Avoid taking new credit simply to increase available limit."
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
    ):

        response = (
            f"Your current recorded credit score is "
            f"**{score}**.\n\n"

            f"To work toward a healthier credit profile:\n"
            f"- Make every payment on time.\n"
            f"- Keep credit utilization under control.\n"
            f"- Avoid unnecessary credit applications.\n"
            f"- Maintain a healthy credit history over time."
        )

        suggestions = [
            "How long does score improvement take?",
            "What affects a credit score?",
            "How can I avoid missed payments?"
        ]

    # -----------------------------------------------------
    # LOANS / EMI
    # -----------------------------------------------------

    elif (
        "loan" in lowered
        or "emi" in lowered
    ):

        loans = (
            profile.active_loans
            if profile
            else 0
        )

        debt = (
            profile.total_debt
            if profile
            else 0
        )

        response = (
            f"You currently have **{loans} active loan(s)** "
            f"recorded in your profile, with total debt of "
            f"**₹{debt:,.2f}**.\n\n"

            f"Focus on making EMIs on time and avoid taking "
            f"unnecessary additional debt."
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

        response = (
            "Hello! 👋 I'm your **CreditGenius** assistant.\n\n"

            "I can help you with:\n"
            "- Credit score\n"
            "- Credit utilization\n"
            "- Loans and EMIs\n"
            "- Missed payments\n"
            "- Debt management\n"
            "- Credit-health improvement"
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
# RULE-BASED RECOMMENDATIONS
# =========================================================

def rule_based_recommendations(profile):

    score = (
        profile.credit_score
        if profile and profile.credit_score
        else 720
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

    if score >= 750:
        health = "Excellent"

    elif score >= 700:
        health = "Good"

    elif score >= 650:
        health = "Fair"

    else:
        health = "Needs Attention"

    strengths = []
    risks = []
    actions = []

    if score >= 700:

        strengths.append(
            "Recorded credit score is in a relatively strong range."
        )

    else:

        risks.append(
            "Recorded credit score indicates room for improvement."
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
            f"Credit utilization is relatively high at "
            f"{utilization}%."
        )

        actions.append(
            "Work toward reducing revolving credit utilization."
        )

    actions.append(
        "Monitor your credit profile regularly."
    )

    actions.append(
        "Avoid unnecessary credit applications."
    )

    return {
        "summary": (
            f"Your recorded credit profile is currently "
            f"assessed as '{health}' with a score of {score}."
        ),

        "cibil_health_status": health,

        "strengths": strengths,

        "risk_factors": risks or [
            "No major immediate risks identified from "
            "the supplied data."
        ],

        "actionable_steps": actions,

        "target_score_projection": (
            "Future score cannot be guaranteed; focus on "
            "consistent healthy credit behavior."
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
        "Credit analysis is based on the information available "
        "in Credit Assistant and is not an official credit bureau report."
    )


    prompt = f"""
You are an educational credit-risk assistant for India.

Analyze this user's credit profile.

Return ONLY valid JSON:

{{
  "cibil_health_score": 720,
  "health_grade": "Good",
  "summary": "short analysis",
  "key_positive_factors": ["factor 1"],
  "critical_risk_factors": ["risk 1"],
  "immediate_action_items": ["action 1"],
  "long_term_strategy": ["strategy 1"],
  "educational_disclaimer": "{disclaimer}"
}}

Use the user's recorded score if available.

Do not guarantee future score changes.

Do not claim access to an official CIBIL report.

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
# RULE-BASED CREDIT ANALYSIS
# =========================================================

def rule_based_analysis(
    profile,
    disclaimer
):

    score = (
        profile.credit_score
        if profile and profile.credit_score
        else 720
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

    if score >= 750:
        grade = "Excellent"

    elif score >= 700:
        grade = "Good"

    elif score >= 650:
        grade = "Fair"

    else:
        grade = "Needs Attention"

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
            "Reduce revolving credit utilization."
        )

    return {

        "cibil_health_score": score,

        "health_grade": grade,

        "summary": (
            f"Your recorded credit profile is assessed as "
            f"'{grade}' with a score of {score}. "
            f"Credit utilization is {utilization}% and "
            f"{missed} missed payment(s) are recorded."
        ),

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
            "Maintain consistent payment behavior.",
            "Keep credit utilization under control.",
            "Avoid unnecessary credit applications."
        ],

        "educational_disclaimer": disclaimer
    }

