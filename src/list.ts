type ListOptions = ErrLoggable<{ type?: TriggerType; safe?: boolean }>;

/**
 * @summary utility for filtering triggers
 * @private
 */
const makeTriggerFilter_ =
    ({ funcName, id, type }: Partial<TriggerInfo>) =>
    (trigger: GoogleAppsScript.Script.Trigger) => {
        const { funcName: f, type: t, id: i } = triggerToInfo_(trigger);

        const sameFunc = !funcName || funcName === f;
        const sameType = !type || type === t.replace(/"/g, "");
        const sameId = !id || id === i;

        return [sameFunc, sameType, sameId].every(Boolean);
    };

/**
 * @summary utility for filtering trigger info
 * @private
 */
const makeTriggerInfoFilter_ =
    ({ funcName, id, type }: Partial<TriggerInfo>) =>
    (info: TriggerInfo) => {
        const { funcName: f, id: i, type: t } = info;

        const sameFunc = !funcName || funcName === f;
        const sameType = !type || type === t.replace(/"/g, "");
        const sameId = !id || id === i;

        return [sameFunc, sameType, sameId].every(Boolean);
    };

/**
 * @summary lists tracked triggers
 */
const listTrackedTriggers = () => {
    const key = getTrackingPropertyName_();
    if (!key) return [];
    const tracked: Record<string, string> = JSON.parse(getProperty_(key, "{}"));
    return Object.entries(tracked).map(([id, record]) =>
        recordToInfo_(record, id)
    );
};

const triggerToInfo_ = (
    trg: GoogleAppsScript.Script.Trigger,
    installerConfig: Partial<InstallOptions> = {}
): TriggerInfo => ({
    funcName: trg.getHandlerFunction(),
    id: trg.getUniqueId(),
    type: <EventType>JSON.stringify(trg.getEventType()),
    installerConfig,
});

/**
 * @summary lists all available triggers for a user
 */
const listTriggers = ({
    onError = console.warn,
    safe = false,
    type = "project",
}: ListOptions = {}) => {
    try {
        const typeMap: Map<
            TriggerType,
            (...args: any[]) => GoogleAppsScript.Script.Trigger[]
        > = new Map([
            ["project", ScriptApp.getProjectTriggers],
            ["user", ScriptApp.getUserTriggers],
        ]);

        const params = [];
        if (type === "user") params.push(getActiveDoc_({ onError }));

        const tgs = typeMap.get(type)!.apply(ScriptApp, params);

        return safe ? tgs.map((t) => triggerToInfo_(t)) : tgs;
    } catch (error) {
        onError(error);
        return [];
    }
};

Object.assign(this, {
    listTrackedTriggers,
    listTriggers,
});
