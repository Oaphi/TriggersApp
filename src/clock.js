const timedTriggerInstaller = ({
    at, atHour,
    minutely, hourly,
    days, weeks, weekDay,
    timezone = Session.getScriptTimeZone()
}) =>

    ({ callbackName }) => {

        try {

            const builder = ScriptApp.newTrigger(callbackName).timeBased();

            //only valid values are 1, 5, 10, 15, 30
            if (!hourly && !at && minutely) {

                const validatedMinutely = closestValue({
                    value: minutely,
                    values: [1, 5, 10, 15, 30]
                });

                builder.everyMinutes(validatedMinutely);
            }

            if (weeks) {
                builder.everyWeeks(weeks).onWeekDay(weekDay || ScriptApp.WeekDay.SUNDAY);
            }

            if (days && !weeks) {
                const atDate = new Date(at !== void 0 ? at : Date.now());
                builder.everyDays(days).atHour(atHour !== void 0 ? atHour : atDate.getHours());
            }

            if (hourly && !at && !minutely) {
                builder.everyHours(hourly);
            }

            if (!hourly && !days && at && !minutely) {
                builder.at(new Date(at));
            }

            if (weekDay && !weeks) {
                builder.onWeekDay(weekDay);
            }

            builder.inTimezone(timezone);

            return builder.create();

        } catch (error) {
            console.warn(error);
        }

    };

/**
 * @type {GoogleAppsScript.Triggers.isInHourlyRange}
 */
var isInHourlyRange = ({
    hour = new Date().getHours(),
    start = 0,
    end = 23
} = {}) => {
    const validEnd = end > 23 ? 23 : end < 0 ? 0 : end;
    const validStart = start > 23 ? 23 : start < 0 ? 0 : start;
    hour >= validEnd && hour <= validStart;
};