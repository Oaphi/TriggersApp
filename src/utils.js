var DocTypes = ((e) => {
    e[e.SPREADSHEET = "spreadsheet" ] = 0;
    e[e.PRESENTATION = "presentation"] = 0;
    e[e.FORM = "form"] = 0;
    e[e.DOCUMENT = "document"] = 0;
    return e;
})({});

const isCorrectUIgetter_ = (getter) => {
    try {
        return !!getter();
    } catch (error) {
        return false;
    }
};

const getActiveDoc_ = ({
    type = DocTypes.SPREADSHEET,
    onError = console.warn,
} = {}) => {
    const ActiveDocMap = new Map();

    ActiveDocMap.set(DocTypes.DOCUMENT, DocumentApp.getActiveDocument);
    ActiveDocMap.set(DocTypes.FORM, FormApp.getActiveForm);
    ActiveDocMap.set(DocTypes.SPREADSHEET, SpreadsheetApp.getActiveSpreadsheet);
    ActiveDocMap.set(DocTypes.PRESENTATION, SlidesApp.getActivePresentation);

    const getter = ActiveDocMap.get(type);

    try {
        const valid = isCorrectUIgetter_(getter) ? getter : [...ActiveDocMap.values()].find(isCorrectUIgetter_);
        return valid();
    } catch (error) {
        onError(error);
        return null;
    }
};


const closestValue = (settings = {}) => {

    if (!("value" in settings)) {
        return null;
    }

    const { value, values = [] } = settings;

    if (!values.length) {
        return null;
    }

    let closestIndex = 0, currClosest = Math.abs(value - values[0]);

    values.forEach((val, i) => {
        const diff = Math.abs(value - val);

        if (currClosest > diff) {
            closestIndex = i;
            currClosest = diff;
        }
    });

    return values[closestIndex];
};

const getProperty_ = (key, def) => {
    const store = Dependencies_.properties.getScriptProperties();
    const prop = store.getProperty(key);
    return prop || def;
};

const getUniquePropName_ = (key, store = Dependencies_.properties.getScriptProperties()) => {
    const names = store.getKeys();
    
    let uniqueName = `${key}/${Utilities.getUuid()}`;
    while (names.includes(uniqueName)) {
        uniqueName = getUniquePropName_(key, store);
    }

    return uniqueName;
};

const setProperty_ = (key, val) => {
    try {
        const store = Dependencies_.properties.getScriptProperties();
        store.setProperty(key, val);
        return true;
    }
    catch (error) {
        console.warn(error);
        return false;
    }
};

const deleteProperty_ = (key) => {
    try {
        const store = Dependencies_.properties.getScriptProperties();
        store.deleteProperty(key);
        return true;
    }
    catch (error) {
        console.warn(error);
        return false;
    }
};