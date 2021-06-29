enum TriggerTypes {
    CLOCK = "CLOCK",
    EDIT = "ON_EDIT",
    CHANGE = "ON_CHANGE",
    SUBMIT = "ON_FORM_SUBMIT",
}

type CommonInstallOptions = ErrLoggable<{
    callbackName: string;
}>;

type Require<T, K extends keyof T> = { [P in keyof T]: T[P] } &
    { [P in K]-?: T[P] };

type InstallerOptions =
    | FormSubmitInstallerOptions
    | ChangeInstallerOptions
    | EditInstallerOptions
    | TimeInstallerOptions;

type InstallOptions = CommonInstallOptions & {
    id?: string;
    unique?: boolean;
    type?: EventType;
    installerConfig?: InstallerOptions;
    installer: (
        options: CommonInstallOptions
    ) => GoogleAppsScript.Script.Trigger | null;
    onGet?: (trigger: GoogleAppsScript.Script.Trigger) => any;
    onInstall?: (trigger: GoogleAppsScript.Script.Trigger) => void;
    onInstallFailure?: (
        options: Pick<InstallOptions, "callbackName" | "type" | "unique">
    ) => void;
};

const installTrigger_ = ({
    unique = false,
    type,
    onError,
    onInstall,
    onInstallFailure,
    installer,
    callbackName,
}: Require<InstallOptions, "onInstall" | "onInstallFailure">) => {
    if (unique) {
        const alreadyInstalled = getTrackedTriggerInfo({
            funcName: callbackName,
            type,
        });
        if (alreadyInstalled) return null;
    }

    const installed = installer({ callbackName, onError });

    if (installed && isTrackingTriggers()) trackTrigger(installed);

    installed
        ? onInstall(installed)
        : onInstallFailure({
              callbackName,
              type,
              unique,
          });

    return installed;
};

/**
 * @summary reinstalls a tracked trigger
 */
const getOrReinstallTrigger = ({
    callbackName,
    type = "CLOCK",
    id,
    onError = (err) => console.warn(err),
    ...rest
}: InstallOptions) => {
    try {
        const deleted = deleteTracked({
            onError,
            id,
            type,
            funcName: callbackName,
        });

        if (!deleted) return false;

        return !!getOrInstallTrigger({
            onError,
            callbackName,
            ...rest,
        });
    } catch (error) {
        onError(error);
        return false;
    }
};

/**
 * @summary gets ore installs a tracked trigger
 */
const getOrInstallTrigger = ({
    unique = false,
    callbackName,
    id,
    installer,
    installerConfig = {},
    onError = console.warn,
    onInstall = (trg) => console.log(`installed: ${trg.getHandlerFunction()}`),
    onInstallFailure = (msg) =>
        console.warn(`failed to install trigger: ${msg}`),
    onGet = (trg) => console.log(`found handler: ${trg.getHandlerFunction()}`),
    type = TriggerTypes.CLOCK,
}: InstallOptions) => {
    try {
        const triggers = ScriptApp.getProjectTriggers();

        const installersMap: Map<
            EventType,
            (
                opts: CommonInstallOptions
            ) => GoogleAppsScript.Script.Trigger | null
        > = new Map([
            [TriggerTypes.SUBMIT, formSubmitTriggerInstaller(installerConfig)],
            [TriggerTypes.CHANGE, changeTriggerInstaller(installerConfig)],
            [TriggerTypes.CLOCK, timedTriggerInstaller(installerConfig)],
            [TriggerTypes.EDIT, editTriggerInstaller(installerConfig)],
        ]);

        const filter = makeTriggerFilter_({ id, type, funcName: callbackName });

        const oldTrigger = triggers.find(filter);

        if (oldTrigger) return onGet(oldTrigger);

        return installTrigger_({
            id,
            unique,
            type,
            installer: installer || installersMap.get(type),
            callbackName,
            onInstall,
            onInstallFailure,
            onError,
        });
    } catch (error) {
        onError(`error during trigger check ${error}`);
        return null;
    }
};