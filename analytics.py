def calculate_credit_utilization(
    credit_card_balance: float,
    credit_limit: float
):
    if credit_limit <= 0:
        return 0

    utilization = (
        credit_card_balance / credit_limit
    ) * 100

    return round(utilization, 2)


def calculate_dti(
    total_debt: float,
    monthly_income: float
):
    if monthly_income <= 0:
        return 0

    dti = (
        total_debt / (monthly_income * 12)
    ) * 100

    return round(dti, 2)


def calculate_financial_health(
    credit_score,
    utilization,
    dti,
    missed_payments
):
    score = 0

    # Credit score
    if credit_score is not None:
        if credit_score >= 750:
            score += 30
        elif credit_score >= 700:
            score += 25
        elif credit_score >= 650:
            score += 20
        else:
            score += 10

    # Credit utilization
    if utilization <= 30:
        score += 25
    elif utilization <= 50:
        score += 15
    else:
        score += 5

    # DTI
    if dti <= 30:
        score += 25
    elif dti <= 50:
        score += 15
    else:
        score += 5

    # Missed payments
    if missed_payments == 0:
        score += 20
    elif missed_payments <= 2:
        score += 10

    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "Good"
    elif score >= 40:
        return "Fair"
    else:
        return "Needs Improvement"