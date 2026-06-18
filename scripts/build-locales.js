#!/usr/bin/env node
/**
 * Merge form-config labels into locale JSON and regenerate bundled.js.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const formConfigPath = path.join(root, 'js/form-config.js');

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
        joinDate: 'Added to list date',
        totalScore: 'Total score',
        isStep2: 'Step 2 customer',
        discussionDate: 'Discussion date',
        followupPlan: 'Follow-up plan',
        followupDate: 'Action date',
        followupFeedback: 'Feedback',
        needs: 'Needs analysis',
        hasCard: 'Has credit card',
        joinFee: 'Franchise fee',
        maKnowledge: 'Market America knowledge',
        questions: 'Questions/objections',
        discussedMA: 'Discussed Market America concept',
        features: 'Features introduced',
        triedProduct: 'Tried product',
        usingProduct: 'Using product',
        customerNeeds: 'Customer needs'
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
        relationshipCloseness: {
            _empty: 'Please select',
            '非常親近': 'Very close',
            '親近': 'Close',
            '普通': 'Neutral',
            '疏遠': 'Distant',
            '非常疏遠': 'Very distant'
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

function translateForms(zhForms, overrides) {
    const en = JSON.parse(JSON.stringify(zhForms));
    Object.assign(en.sections, overrides.sections || {});
    Object.assign(en.subsections, overrides.subsections || {});
    Object.assign(en.fields, overrides.fields || {});
    Object.assign(en.placeholders, overrides.placeholders || {});
    Object.assign(en.checkboxes, overrides.checkboxes || {});
    en.options = { ...en.options, ...(overrides.options || {}) };
    en.common = overrides.common;
    return en;
}

function mergeLocale(filePath, forms, extra = {}) {
    const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    locale.forms = forms;
    Object.assign(locale, extra);
    fs.writeFileSync(filePath, `${JSON.stringify(locale, null, 2)}\n`);
}

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

mergeLocale(path.join(root, 'locales/zh-TW.json'), zhForms);
mergeLocale(path.join(root, 'locales/en.json'), enForms);

const zh = JSON.parse(fs.readFileSync(path.join(root, 'locales/zh-TW.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(root, 'locales/en.json'), 'utf8'));
const bundled = `globalThis.__FOLLOWUP_LOCALES__ = ${JSON.stringify({ 'zh-TW': zh, en }, null, 4)};\n`;
fs.writeFileSync(path.join(root, 'js/locales/bundled.js'), bundled);

console.log('Locales updated:', Object.keys(zhForms.fields).length, 'fields');
