/**
 * Epic 6.5 — Overtime Calculation Engine
 *
 * Calculates overtime based on the OT rules snapshot captured at booking time.
 * Rules are stored in bookings.ot_terms_snapshot as JSON.
 *
 * Supported rule types:
 * - daily: OT after X hours/day (e.g. CA law: 8h/day daily OT, 12h/day double OT)
 * - weekly: OT after X hours/week (e.g. federal: 40h/week OT)
 * - weekend: all weekend hours at OT rate
 * - seventh_day: 7th consecutive day rule (California)
 */

export interface OtTermsSnapshot {
    ot_rate_type: "1.5x" | "2x" | "none";
    ot_rule_daily?: number;         // hours/day after which daily OT kicks in (e.g. 8)
    ot_rule_daily_double?: number;  // hours/day after which double OT kicks in (e.g. 12)
    ot_rule_weekly?: number;        // hours/week after which weekly OT kicks in (e.g. 40)
    ot_rule_weekend?: boolean;      // all weekend hours at OT rate
    seventh_day_rule?: boolean;     // 7th consecutive day all at OT (CA)
}

export interface TimePeriod {
    date: string;          // ISO date "YYYY-MM-DD"
    minutes: number;       // total minutes worked that day (net of breaks)
    day_of_week: number;   // 0 = Sun, 6 = Sat
}

export interface OvertimeResult {
    regular_minutes: number;
    ot_minutes: number;         // 1.5x overtime
    double_ot_minutes: number;  // 2x overtime
    weekend_ot_minutes: number;
    total_minutes: number;
    ot_rate_multiplier: number;
    breakdown: {
        date: string;
        regular: number;
        ot: number;
        double_ot: number;
        is_weekend: boolean;
    }[];
}

/**
 * Calculate overtime for a set of worked time periods using the OT terms snapshot.
 */
export function calculateOvertime(
    periods: TimePeriod[],
    otTerms: OtTermsSnapshot
): OvertimeResult {
    const rateMultiplier = otTerms.ot_rate_type === "2x" ? 2 : otTerms.ot_rate_type === "1.5x" ? 1.5 : 1;

    let totalRegular = 0;
    let totalOt = 0;
    let totalDoubleOt = 0;
    let totalWeekendOt = 0;
    let weeklyMinutes = 0;
    const breakdownItems: OvertimeResult["breakdown"] = [];

    // Sort periods by date ascending
    const sorted = [...periods].sort((a, b) => a.date.localeCompare(b.date));
    let consecutiveDays = 0;
    let lastDate: string | null = null;

    for (const period of sorted) {
        const isWeekend = period.day_of_week === 0 || period.day_of_week === 6;
        let dayRegular = 0;
        let dayOt = 0;
        let dayDoubleOt = 0;
        let remaining = period.minutes;

        // Seventh day rule (CA): 7th consecutive workday → all OT
        if (lastDate) {
            const lastDt = new Date(lastDate);
            const curDt = new Date(period.date);
            const diffDays = Math.round((curDt.getTime() - lastDt.getTime()) / (1000 * 60 * 60 * 24));
            consecutiveDays = diffDays === 1 ? consecutiveDays + 1 : 1;
        } else {
            consecutiveDays = 1;
        }
        lastDate = period.date;
        const isSeventhDay = otTerms.seventh_day_rule && consecutiveDays >= 7;

        if (isWeekend && otTerms.ot_rule_weekend) {
            // All weekend hours → OT
            dayOt = remaining;
            totalWeekendOt += remaining;
            remaining = 0;
        } else if (isSeventhDay) {
            // 7th consecutive day → all OT
            dayOt = remaining;
            remaining = 0;
        } else {
            // Daily OT rules
            const dailyOtThreshold = (otTerms.ot_rule_daily || 8) * 60; // convert h to min
            const dailyDoubleOtThreshold = (otTerms.ot_rule_daily_double || 12) * 60;

            if (remaining <= dailyOtThreshold) {
                dayRegular += remaining;
                remaining = 0;
            } else if (remaining <= dailyDoubleOtThreshold) {
                dayRegular += dailyOtThreshold;
                dayOt += remaining - dailyOtThreshold;
                remaining = 0;
            } else {
                dayRegular += dailyOtThreshold;
                dayOt += dailyDoubleOtThreshold - dailyOtThreshold;
                dayDoubleOt += remaining - dailyDoubleOtThreshold;
                remaining = 0;
            }
        }

        // Weekly OT override (after daily calculation)
        const weeklyOtThreshold = (otTerms.ot_rule_weekly || 40) * 60;
        if (weeklyMinutes < weeklyOtThreshold && weeklyMinutes + dayRegular > weeklyOtThreshold) {
            const regularBeforeWeeklyOt = weeklyOtThreshold - weeklyMinutes;
            const weeklyOtStart = dayRegular - regularBeforeWeeklyOt;
            dayOt += weeklyOtStart;
            dayRegular = regularBeforeWeeklyOt;
        } else if (weeklyMinutes >= weeklyOtThreshold) {
            // All regular time this day becomes OT due to weekly limit
            dayOt += dayRegular;
            dayRegular = 0;
        }
        weeklyMinutes += period.minutes;

        totalRegular += dayRegular;
        totalOt += dayOt;
        totalDoubleOt += dayDoubleOt;
        breakdownItems.push({
            date: period.date,
            regular: dayRegular,
            ot: dayOt,
            double_ot: dayDoubleOt,
            is_weekend: isWeekend,
        });
    }

    return {
        regular_minutes: totalRegular,
        ot_minutes: totalOt,
        double_ot_minutes: totalDoubleOt,
        weekend_ot_minutes: totalWeekendOt,
        total_minutes: totalRegular + totalOt + totalDoubleOt,
        ot_rate_multiplier: rateMultiplier,
        breakdown: breakdownItems,
    };
}

/**
 * Calculate total pay for a worker's time periods given their hourly rate and OT terms.
 * Returns amounts in cents.
 */
export function calculatePayWithOvertime(
    periods: TimePeriod[],
    hourlyRateCents: number,
    otTerms: OtTermsSnapshot
): {
    total_cents: number;
    regular_cents: number;
    ot_cents: number;
    double_ot_cents: number;
    ot_breakdown: OvertimeResult;
} {
    const ot = calculateOvertime(periods, otTerms);
    const minuteRate = hourlyRateCents / 60;
    const otMultiplier = otTerms.ot_rate_type === "2x" ? 2
        : otTerms.ot_rate_type === "1.5x" ? 1.5 : 1;

    const regularCents = Math.round(ot.regular_minutes * minuteRate);
    const otCents = Math.round(ot.ot_minutes * minuteRate * otMultiplier);
    const doubleOtCents = Math.round(ot.double_ot_minutes * minuteRate * 2);

    return {
        total_cents: regularCents + otCents + doubleOtCents,
        regular_cents: regularCents,
        ot_cents: otCents,
        double_ot_cents: doubleOtCents,
        ot_breakdown: ot,
    };
}
