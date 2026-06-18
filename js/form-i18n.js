/**
 * Resolve form-config labels/options from locale keys.
 * Stored field values stay unchanged for import/export compatibility.
 */
function translateLabel(key, fallback) {
    if (typeof t !== 'function') {
        return fallback;
    }
    const translated = t(key);
    return translated !== key ? translated : fallback;
}

function localizeField(field) {
    const localized = { ...field };
    localized.label = translateLabel(`forms.fields.${field.id}`, field.label);

    if (field.placeholder) {
        localized.placeholder = translateLabel(`forms.placeholders.${field.id}`, field.placeholder);
    }

    if (field.options) {
        localized.options = field.options.map((option) => {
            const optionKey = option.id
                ? `forms.checkboxes.${option.id}`
                : `forms.options.${field.id}.${option.value === '' ? '_empty' : option.value}`;
            return {
                ...option,
                label: translateLabel(optionKey, option.label)
            };
        });
    }

    return localized;
}

function localizeFormConfig(config) {
    const localized = { sections: {} };

    Object.entries(config.sections).forEach(([sectionId, section]) => {
        const nextSection = { ...section };
        nextSection.title = translateLabel(`forms.sections.${sectionId}`, section.title);

        if (section.addButtonText) {
            nextSection.addButtonText = translateLabel(
                `forms.sections.${sectionId}.addButton`,
                section.addButtonText
            );
        }

        if (section.fields) {
            nextSection.fields = section.fields.map(localizeField);
        }

        if (section.itemFields) {
            nextSection.itemFields = section.itemFields.map(localizeField);
        }

        if (section.subsections) {
            nextSection.subsections = {};
            Object.entries(section.subsections).forEach(([subsectionId, subsection]) => {
                nextSection.subsections[subsectionId] = {
                    ...subsection,
                    title: translateLabel(
                        `forms.subsections.${subsectionId}`,
                        subsection.title
                    ),
                    fields: subsection.fields.map(localizeField)
                };
            });
        }

        localized.sections[sectionId] = nextSection;
    });

    return localized;
}

function getLocalizedFormConfig() {
    return localizeFormConfig(window.formConfig);
}

if (typeof window !== 'undefined') {
    window.localizeFormConfig = localizeFormConfig;
    window.getLocalizedFormConfig = getLocalizedFormConfig;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { localizeFormConfig, getLocalizedFormConfig, translateLabel };
}
