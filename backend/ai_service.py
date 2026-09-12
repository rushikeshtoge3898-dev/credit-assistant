import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def get_cibil_context(profile, accounts=None):
    if not profile:
        return "No credit profile available yet."

    utilization = 0.0
    if profile.credit_limit > 0:
        utilization = round((profile.credit_card_balance / profile.credit_limit) * 100, 2)

    dti = 0.0
    if profile.monthly_income > 0:
        dti = round((profile.total_debt / (profile.monthly_income * 12)) * 100, 2)

    accounts_str = "None logged"
    if accounts:
        accounts_list = [
            f"- {acc.account_name} ({acc.bank_name}, Type: {acc.account_type}): Balance ₹{acc.current_balance:,.2f}, Limit/Principal ₹{acc.credit_limit:,.2f}, EMI ₹{acc.monthly_emi:,.2f}, Status: {acc.payment_status}"
            for acc in accounts
        ]
        accounts_str = "\n".join(accounts_list)

    return f"""
Current User Credit & Financial Profile (India / CIBIL context):
- CIBIL Credit Score: {profile.credit_score if profile.credit_score else 'Not generated yet (New to credit)'} (Scale: 300-900)
- Monthly Income: ₹{profile.monthly_income:,.2f}
- Total Debt: ₹{profile.total_debt:,.2f}
- Total Credit Card Limit: ₹{profile.credit_limit:,.2f}
- Outstanding Credit Card Balance: ₹{profile.credit_card_balance:,.2f}
- Credit Utilization: {utilization}% (Ideal CIBIL recommendation is <= 30%)
- Debt-to-Income (DTI): {dti}%
- Active Loans: {profile.active_loans}
- Missed / Overdue Payments: {profile.missed_payments}
- User Financial Goal: {profile.financial_goal or 'Improve overall credit profile'}
- Active Accounts:
{accounts_str}
"""


def generate_ai_chat_response(user_message: str, profile, accounts=None, chat_history=None) -> dict:
    context = get_cibil_context(profile, accounts)
    
    system_instruction = f"""
You are "CreditGenius", an expert AI Credit & Financial Assistant specialized in Indian personal finance and CIBIL / Experian / CRIF credit scoring (range 300 to 900).
Always be encouraging, realistic, accurate, and actionable. Format money in Indian Rupees (₹).
Use bullet points and bold highlights for clarity.

Rules:
1. Ground advice on CIBIL criteria:
   - Payment History (35% impact) - Never miss an EMI / credit card due date.
   - Credit Utilization Ratio (CUR) (30% impact) - Keep below 30% of total limit.
   - Credit Mix (10-15% impact) - Healthy mix of secured (home/auto) and unsecured (credit card/personal) loans.
   - Credit Age & Inquiries (20% impact) - Don't apply for multiple credit cards/loans at once to prevent hard inquiries (CIBIL dips).
2. Keep replies concise, actionable, and formatted nicely in clean Markdown.
3. Provide 2-3 short follow-up suggested question chips relevant to the response.

User Profile:
{context}
"""

    if GEMINI_API_KEY:
        try:
            # Attempt to use gemini-1.5-flash or gemini-2.0-flash
            model_names = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]
            model = None
            for m in model_names:
                try:
                    model = genai.GenerativeModel(m)
                    break
                except Exception:
                    continue

            if model:
                full_prompt = f"{system_instruction}\n\nUser Question: {user_message}\n\nPlease respond with your advice, and at the very end on a new line output: [SUGGESTIONS: question 1 | question 2 | question 3]"
                response = model.generate_content(full_prompt)
                text = response.text

                suggestions = []
                if "[SUGGESTIONS:" in text:
                    parts = text.split("[SUGGESTIONS:")
                    main_text = parts[0].strip()
                    sugg_part = parts[1].replace("]", "").strip()
                    suggestions = [s.strip() for s in sugg_part.split("|") if s.strip()]
                    return {"response": main_text, "suggested_actions": suggestions[:3]}
                
                return {
                    "response": text.strip(),
                    "suggested_actions": [
                        "How to bring my credit utilization below 30%?",
                        "What is the impact of closing an old credit card?",
                        "How long does it take to rebuild a 750+ CIBIL score?"
                    ]
                }
        except Exception as e:
            print(f"Gemini API error: {e}, falling back to intelligent rule-based engine.")

    # Rule-based fallback if no Gemini key or network issue
    score = profile.credit_score if profile and profile.credit_score else 700
    utilization = 0.0
    if profile and profile.credit_limit > 0:
        utilization = round((profile.credit_card_balance / profile.credit_limit) * 100, 1)

    lowered = user_message.lower()
    if "utilization" in lowered or "card" in lowered or "limit" in lowered:
        resp = f"Your current credit utilization is **{utilization}%**. In India, CIBIL penalizes utilization above **30%**.\n\n" \
               f"**Quick action items:**\n" \
               f"- Pay down at least ₹{max(0, (profile.credit_card_balance - (profile.credit_limit * 0.25))):,.2f} before your billing cycle ends.\n" \
               f"- Request a credit limit enhancement from your bank (e.g. HDFC, SBI) without taking extra debt, which instantly reduces your utilization ratio.\n" \
               f"- Split your spends across two billing cycles or make mid-month payments."
        sugg = ["How to request a credit limit increase?", "Will paying before the statement date help?", "How to track billing cycles?"]
    elif "improve" in lowered or "boost" in lowered or "increase" in lowered or "score" in lowered:
        resp = f"Your current score is **{score}**. To target an **Excellent 750+ CIBIL score**, follow these golden steps:\n\n" \
               f"1. **Zero Missed Payments**: Set auto-debit on total due, not minimum amount due (Payment history is 35% of CIBIL).\n" \
               f"2. **Cap Utilization at 25-30%**: Currently at {utilization}%. Keeping this low provides an immediate 15-35 point lift within 60 days.\n" \
               f"3. **Avoid Multiple Loan Inquiries**: Do not apply for multiple credit cards or NBFC instant loans within 90 days."
        sugg = ["What happens if I only pay the minimum due?", "How often is CIBIL score updated by banks?", "Should I close unused cards?"]
    elif "loan" in lowered or "emi" in lowered:
        resp = f"You currently have **{profile.active_loans if profile else 0} active loan(s)** with total debt of **₹{profile.total_debt if profile else 0:,.2f}**.\n\n" \
               f"- Prioritize repaying high-interest unsecured personal loans or credit card balances first (Avalanche method).\n" \
               f"- Ensure your Debt-to-Income (DTI) ratio stays below 40% so banks view you as a low-risk borrower."
        sugg = ["How does loan pre-closure affect CIBIL?", "What is a good DTI ratio in India?", "Secured vs Unsecured loans"]
    else:
        resp = f"Hello! As your AI Credit Assistant, I'm here to help you optimize your CIBIL score (currently **{score}**) and manage your Indian credit portfolio.\n\n" \
               f"Here are key areas we can explore:\n" \
               f"- Lowering your credit utilization (currently **{utilization}%**)\n" \
               f"- Creating a structured debt payoff plan\n" \
               f"- Best practices for CIBIL score tracking and dispute resolution\n\n" \
               f"Feel free to ask any specific credit question!"
        sugg = ["Analyze my complete credit health", "How to reach 750+ CIBIL score?", "How to reduce debt quickly?"]

    return {"response": resp, "suggested_actions": sugg}


def generate_ai_recommendations(profile, accounts=None) -> dict:
    context = get_cibil_context(profile, accounts)

    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
You are a senior CIBIL credit analyst in India. Analyze the following user profile and return a valid JSON object matching this structure:
{{
  "summary": "2-3 sentence overview of the user's CIBIL profile",
  "cibil_health_status": "Excellent" | "Good" | "Fair" | "Needs Attention",
  "strengths": ["point 1", "point 2"],
  "risk_factors": ["risk 1", "risk 2"],
  "actionable_steps": ["step 1", "step 2", "step 3", "step 4"],
  "target_score_projection": "Realistic 6-month projected CIBIL score range, e.g., 760 - 785 (+40 pts)"
}}

User Profile:
{context}

Respond ONLY with valid JSON.
"""
            res = model.generate_content(prompt)
            clean_text = res.text.strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.strip("`").replace("json", "").strip()
            data = json.loads(clean_text)
            return data
        except Exception as e:
            print(f"Gemini recommendations error: {e}, falling back to rule-based engine.")

    # Rule-based fallback
    score = profile.credit_score if profile and profile.credit_score else 720
    utilization = 0.0
    if profile and profile.credit_limit > 0:
        utilization = round((profile.credit_card_balance / profile.credit_limit) * 100, 1)

    missed = profile.missed_payments if profile else 0
    dti = 0.0
    if profile and profile.monthly_income > 0:
        dti = round((profile.total_debt / (profile.monthly_income * 12)) * 100, 1)

    strengths = []
    risks = []
    actions = []

    if score >= 750:
        health_status = "Excellent"
        strengths.append("High CIBIL score (750+) unlocks prime lending rates and pre-approved offers from Indian banks.")
    elif score >= 700:
        health_status = "Good"
        strengths.append("Healthy score with strong potential to enter prime tier (750+).")
    elif score >= 650:
        health_status = "Fair"
        risks.append("Score is below prime threshold (700); loan approvals may carry higher interest margins.")
    else:
        health_status = "Needs Attention"
        risks.append("Score is in the caution zone; banks may reject unsecured credit card or loan applications.")

    if missed == 0:
        strengths.append("Clean repayment record with 0 missed payments.")
    else:
        risks.append(f"{missed} missed payment(s) detected. Recent defaults heavily penalize CIBIL score.")
        actions.append("Clear all overdue balances immediately to avoid 30+ DPD (Days Past Due) reporting to CIBIL.")

    if utilization <= 30:
        strengths.append(f"Credit card utilization is at {utilization}%, within the recommended 30% boundary.")
    else:
        risks.append(f"Credit card utilization is high at {utilization}%. High CUR signals credit hunger to lenders.")
        actions.append(f"Pay down credit card outstanding to bring utilization below ₹{(profile.credit_limit * 0.3):,.0f} (30%).")

    if dti > 40:
        risks.append(f"Annual Debt-to-Income ratio is high ({dti}%).")
        actions.append("Avoid new loan applications until existing EMI obligations are reduced.")
    else:
        strengths.append(f"Manageable Debt-to-Income ratio ({dti}%).")

    actions.append("Enable auto-debit for full credit card statement balance each month.")
    actions.append("Maintain oldest credit accounts open to preserve established credit history length.")

    projection = f"{min(850, score + 35)} - {min(880, score + 65)} (+40 to +65 pts)"

    return {
        "summary": f"Your CIBIL profile is currently rated as '{health_status}' with a score of {score}. Your utilization stands at {utilization}% and payment track shows {missed} defaults.",
        "cibil_health_status": health_status,
        "strengths": strengths,
        "risk_factors": risks if risks else ["No major immediate credit risks identified."],
        "actionable_steps": actions,
        "target_score_projection": projection
    }


def generate_ai_credit_analysis(profile, accounts=None, payments=None) -> dict:
    context = get_cibil_context(profile, accounts)
    disclaimer = "Educational estimate based on CIBIL TransUnion scoring methodology. Not an official credit bureau score report."

    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
You are a senior credit risk analyst in India. Perform a deep-dive educational credit analysis on the following profile.
Return a valid JSON matching this schema:
{{
  "cibil_health_score": {profile.credit_score if profile and profile.credit_score else 720},
  "health_grade": "Excellent" | "Good" | "Fair" | "Needs Attention",
  "summary": "3-4 sentence comprehensive analysis of debt, credit utilization, and repayment health",
  "key_positive_factors": ["factor 1", "factor 2"],
  "critical_risk_factors": ["risk 1", "risk 2"],
  "immediate_action_items": ["action 1", "action 2"],
  "long_term_strategy": ["strategy 1", "strategy 2"],
  "educational_disclaimer": "{disclaimer}"
}}

User Context:
{context}

Respond ONLY with valid JSON.
"""
            res = model.generate_content(prompt)
            clean_text = res.text.strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.strip("`").replace("json", "").strip()
            data = json.loads(clean_text)
            data["educational_disclaimer"] = disclaimer
            return data
        except Exception as e:
            print(f"Gemini analysis error: {e}, falling back to rule-based engine.")

    # Rule-based fallback
    score = profile.credit_score if profile and profile.credit_score else 720
    utilization = 0.0
    if profile and profile.credit_limit > 0:
        utilization = round((profile.credit_card_balance / profile.credit_limit) * 100, 1)

    missed = profile.missed_payments if profile else 0
    dti = 0.0
    if profile and profile.monthly_income > 0:
        dti = round((profile.total_debt / (profile.monthly_income * 12)) * 100, 1)

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
    long_term = [
        "Keep your oldest credit accounts open to preserve established credit history age.",
        "Aim for a balanced mix of secured (e.g. Home/Auto) and revolving credit over time."
    ]

    if missed == 0:
        positives.append("Flawless payment history: 100% on-time record across reported credit lines.")
    else:
        risks.append(f"{missed} overdue payment(s) reported, which weighs 35% on CIBIL calculations.")
        actions.append("Prioritize clearing overdue accounts immediately to restore clean reporting status.")

    if utilization <= 30:
        positives.append(f"Low credit card utilization of {utilization}% (well within the recommended 30% ceiling).")
    else:
        risks.append(f"High credit utilization of {utilization}%, indicating dependence on revolving credit lines.")
        target_repay = max(0, profile.credit_card_balance - (profile.credit_limit * 0.3))
        actions.append(f"Pay down at least ₹{target_repay:,.0f} to bring card balance below 30% utilization.")

    if dti <= 35:
        positives.append(f"Manageable annual Debt-to-Income ratio of {dti}%.")
    else:
        risks.append(f"Elevated Debt-to-Income ratio of {dti}%, which may constrain future loan eligibility.")
        actions.append("Restrict new unsecured credit applications until existing obligations reduce.")

    summary = f"Your overall credit profile is evaluated as '{grade}' with a score of {score}. Your revolving card utilization is {utilization}% and annual DTI stands at {dti}% with {missed} reported missed payments."

    return {
        "cibil_health_score": score,
        "health_grade": grade,
        "summary": summary,
        "key_positive_factors": positives if positives else ["Basic credit history established."],
        "critical_risk_factors": risks if risks else ["No acute negative credit events recorded."],
        "immediate_action_items": actions if actions else ["Continue regular monthly auto-debit payments."],
        "long_term_strategy": long_term,
        "educational_disclaimer": disclaimer
    }

