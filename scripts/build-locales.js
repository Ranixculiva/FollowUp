#!/usr/bin/env node
/**
 * Merge form-config labels and country names into locale JSON and regenerate bundled.js.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

const root = path.join(__dirname, '..');
const formConfigPath = path.join(root, 'js/form-config.js');
const countriesFallbackPath = path.join(root, 'data/countries-fallback.json');
const countriesEnPath = path.join(root, 'data/countries-en.json');

function loadFormConfig() {
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(formConfigPath, 'utf8'), context);
    return context.window.formConfig;
}

function collectForms(config) {
    const forms = {
        sections: {},
        subsections: {},
        fields: {},
        placeholders: {},
        options: {},
        checkboxes: {}
    };

    Object.entries(config.sections).forEach(([sectionId, section]) => {
        forms.sections[sectionId] = section.title;
        if (section.addButtonText) {
            forms.sections[`${sectionId}.addButton`] = section.addButtonText;
        }

        const walkFields = (fields) => {
            fields.forEach((field) => {
                forms.fields[field.id] = field.label;
                if (field.placeholder) {
                    forms.placeholders[field.id] = field.placeholder;
                }
                field.options?.forEach((option) => {
                    if (option.id) {
                        forms.checkboxes[option.id] = option.label;
                    } else {
                        if (!forms.options[field.id]) {
                            forms.options[field.id] = {};
                        }
                        const key = option.value === '' ? '_empty' : option.value;
                        forms.options[field.id][key] = option.label;
                    }
                });
            });
        };

        section.fields?.forEach && walkFields(section.fields);
        section.itemFields?.forEach && walkFields(section.itemFields);
        if (section.subsections) {
            Object.entries(section.subsections).forEach(([subsectionId, subsection]) => {
                forms.subsections[subsectionId] = subsection.title;
                walkFields(subsection.fields);
            });
        }
    });

    return forms;
}

const STEAM_SCALE = {
    '0': '0 - None',
    '3': '3 - Some exposure',
    '5': '5 - Professional'
};

const EN_OVERRIDES = {
    sections: {
        basic: 'Basic info',
        step2: 'Step 2 data',
        steam: 'STEAM evaluation',
        formhd: 'FORMHD evaluation',
        evaluation: 'Customer evaluation',
        followup: 'Follow-up plan',
        'followup.addButton': 'Add follow-up plan'
    },
    subsections: {
        family: 'F - Family',
        occupation: 'O - Occupation',
        recreation: 'R - Recreation',
        money: 'M - Money',
        health: 'H - Health',
        dream: 'D - Dreams'
    },
    fields: {
        name: 'Name',
        phone: 'Phone',
        line: 'Line',
        fb: 'FB',
        ig: 'IG',
        address: 'Location',
        country: 'Country/region',
        age: 'Age',
        gender: 'Gender',
        howMet: 'How you met',
        personality: 'Personality',
        maritalStatus: 'Marital status',
        annualIncome: 'Annual income',
        moneyNeeds: 'Financial needs',
        relationship: 'Relationship',
        relationshipCloseness: 'Closeness',
        colorRating: 'Color rating',
        productInterest: 'Product interest',
        interests: 'Interests',
        health: 'Health',
        dreams: 'Dreams',
        lastInviteDate: 'Last invite date',
        lastPresentationDate: 'Product/business presentation date',
        firstFollowUp: 'First follow-up',
        secondFollowUp: 'Second follow-up',
        notes: 'Notes',
        listOwner: 'List Owner',
        joinDate: 'Added to list date',
        steamS: 'S (Sales & service experience)',
        steamT: 'T (Coach or mentor)',
        steamE: 'E (Entrepreneurship experience)',
        steamA: 'A (Positive attitude & charisma)',
        steamM: 'M (Income & income goals)',
        onlineSales: 'Online sales experience',
        connections: 'Network & relationships',
        totalScore: 'Total score',
        isStep2: 'Step 2 customer',
        formF: 'F - Family situation',
        formFSpouse: "Spouse's occupation",
        formFChildren: 'Children (count/ages)',
        formFEducation: 'School / employment',
        formFFamily: 'Household members / pets',
        formFShopping: 'Likes online shopping',
        formFSaving: 'Likes saving money',
        formFNeedMoney: 'Needs money',
        formO: 'Occupation',
        formOIncome: 'Income',
        formOWorkType: 'Work arrangement',
        formOTime: 'Schedule',
        formR: 'Recreation',
        formRDrink: 'Likes tea / coffee',
        formRMakeup: 'Likes makeup',
        formM: 'Financial situation',
        formMNoTime: 'Earns well but little free time',
        formH: 'Health',
        formHExercise: 'Exercise habits',
        formHWeight: 'Wants to lose weight',
        formD: 'D - Future expectations',
        needs: 'Needs analysis',
        hasCard: 'Has credit card',
        joinFee: 'Franchise fee',
        maKnowledge: 'Market America knowledge',
        questions: 'Questions / objections',
        discussedMA: 'Discussed Market America concept',
        features: 'Features introduced',
        triedProduct: 'Tried product',
        usingProduct: 'Using product',
        customerNeeds: 'Customer needs',
        discussionDate: 'Discussion date',
        followupPlan: 'Follow-up plan',
        followupDate: 'Action date',
        followupFeedback: 'Feedback'
    },
    placeholders: {
        formF: 'Enter family situation',
        formO: 'Enter occupation',
        formR: 'Enter recreation',
        formM: 'Enter financial situation',
        formH: 'Enter health status',
        formD: 'Enter future expectations'
    },
    options: {
        gender: { _empty: 'Please select', '男': 'Male', '女': 'Female' },
        maritalStatus: {
            _empty: 'Please select',
            '已婚': 'Married',
            '單身': 'Single',
            '離婚': 'Divorced',
            '喪偶': 'Widowed'
        },
        annualIncome: {
            _empty: 'Please select',
            '50萬以下': 'Under NT$500k',
            '50-100萬': 'NT$500k–1M',
            '100-150萬': 'NT$1M–1.5M',
            '150-200萬': 'NT$1.5M–2M',
            '200萬以上': 'Over NT$2M'
        },
        relationshipCloseness: {
            _empty: 'Please select',
            '非常親近': 'Very close',
            '親近': 'Close',
            '普通': 'Neutral',
            '疏遠': 'Distant',
            '非常疏遠': 'Very distant'
        },
        colorRating: {
            _empty: 'Please select',
            red: 'Red',
            yellow: 'Yellow',
            green: 'Green'
        },
        productInterest: {
            _empty: 'Please select',
            '高': 'High',
            '中': 'Medium',
            '低': 'Low',
            '無': 'None'
        },
        steamS: STEAM_SCALE,
        steamT: STEAM_SCALE,
        steamE: {
            '0': '0 - None',
            '3': '3 - Started or just beginning',
            '5': '5 - Running own business'
        },
        steamA: {
            '0': '0 - Content with status quo',
            '3': '3 - Open to change',
            '5': '5 - Proactive and willing to try'
        },
        steamM: {
            '0': '0 - No income need; content with status quo',
            '3': '3 - Unstable income or urgent need',
            '5': '5 - Stable income; wants extra income'
        },
        onlineSales: STEAM_SCALE,
        connections: {
            '0': '0 - Little social life beyond close family',
            '3': '3 - Narrow circle but open to meeting people',
            '5': '5 - Very wide network / social butterfly'
        }
    },
    checkboxes: {
        needWeightLoss: 'Weight loss',
        needSkincare: 'Skincare & makeup',
        needHealth: 'Health site',
        needIncome: 'Extra income',
        needPassiveIncome: 'Passive income',
        featureWebsite: 'Website tour',
        featureConsumption: 'Consumption transfer',
        featureAnnuity: 'Shopping annuity',
        featurePlatform: 'Five-win platform',
        featureMPCP: 'MPCP',
        needVIP: 'VIP customer',
        needGroupBuy: 'Group buying',
        needHealthBody: 'Physical health'
    },
    common: {
        pleaseSelect: 'Please select',
        addItem: 'Add item',
        requiredField: '{field} is required',
        listItemRequired: '{section} item {index}: {field} is required',
        unsupportedFile: 'Unsupported file format'
    }
};

function deepMergeOptions(base, overrides) {
    const merged = { ...base };
    Object.entries(overrides || {}).forEach(([fieldId, fieldOptions]) => {
        merged[fieldId] = { ...(base[fieldId] || {}), ...fieldOptions };
    });
    return merged;
}

function translateForms(zhForms, overrides) {
    const en = JSON.parse(JSON.stringify(zhForms));
    Object.assign(en.sections, overrides.sections || {});
    Object.assign(en.subsections, overrides.subsections || {});
    Object.assign(en.fields, overrides.fields || {});
    Object.assign(en.placeholders, overrides.placeholders || {});
    Object.assign(en.checkboxes, overrides.checkboxes || {});
    en.options = deepMergeOptions(en.options, overrides.options);
    en.common = overrides.common;
    return en;
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }
            let body = '';
            response.on('data', (chunk) => { body += chunk; });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

async function loadEnglishCountryNames() {
    if (fs.existsSync(countriesEnPath)) {
        return JSON.parse(fs.readFileSync(countriesEnPath, 'utf8'));
    }

    const remote = await fetchJson(
        'https://raw.githubusercontent.com/umpirsky/country-list/master/data/en/country.json'
    );
    fs.writeFileSync(countriesEnPath, `${JSON.stringify(remote, null, 2)}\n`);
    return remote;
}

function collectCountries(fallback, enByCode) {
    const zh = { OTHER: '其他' };
    const en = { OTHER: 'Other' };

    fallback.forEach(({ code, label }) => {
        if (!code) {
            return;
        }
        zh[code] = label;
        en[code] = enByCode[code] || label;
    });

  // Legacy aliases stored as values without ISO codes in old data
    zh['香港'] = zh.HK || '香港';
    en['香港'] = en.HK || 'Hong Kong';

    return { zh, en };
}

function mergeLocale(filePath, forms, countries) {
    const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    locale.forms = forms;
    locale.countries = countries;
    fs.writeFileSync(filePath, `${JSON.stringify(locale, null, 2)}\n`);
}

async function main() {
    const config = loadFormConfig();
    const zhForms = collectForms(config);
    zhForms.common = {
        pleaseSelect: '請選擇',
        addItem: '新增項目',
        requiredField: '{field}為必填欄位',
        listItemRequired: '第 {index} 個{section}的 {field}為必填欄位',
        unsupportedFile: '不支援的檔案格式'
    };

    const enForms = translateForms(zhForms, EN_OVERRIDES);
    const fallback = JSON.parse(fs.readFileSync(countriesFallbackPath, 'utf8'));
    const enByCode = await loadEnglishCountryNames();
    const countryLocales = collectCountries(fallback, enByCode);

    mergeLocale(path.join(root, 'locales/zh-TW.json'), zhForms, countryLocales.zh);
    mergeLocale(path.join(root, 'locales/en.json'), enForms, countryLocales.en);

    const zh = JSON.parse(fs.readFileSync(path.join(root, 'locales/zh-TW.json'), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(root, 'locales/en.json'), 'utf8'));
    const bundled = `globalThis.__FOLLOWUP_LOCALES__ = ${JSON.stringify({ 'zh-TW': zh, en }, null, 4)};\n`;
    fs.writeFileSync(path.join(root, 'js/locales/bundled.js'), bundled);

    console.log('Locales updated:', Object.keys(zhForms.fields).length, 'fields,', Object.keys(countryLocales.zh).length, 'countries');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
