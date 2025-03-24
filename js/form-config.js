const formConfig = {
    sections: {
        basic: {
            title: '基本資料',
            fields: [
                {
                    id: 'name',
                    label: '姓名',
                    type: 'text',
                    required: true
                },
                {
                    id: 'phone',
                    label: '電話',
                    type: 'text'
                },
                {
                    id: 'line',
                    label: 'Line',
                    type: 'text'
                },
                {
                    id: 'fb',
                    label: 'FB',
                    type: 'text'
                },
                {
                    id: 'ig',
                    label: 'IG',
                    type: 'text'
                },
                {
                    id: 'address',
                    label: '居住地',
                    type: 'text'
                },
                {
                    id: 'age',
                    label: '年齡',
                    type: 'number'
                },
                {
                    id: 'gender',
                    label: '性別',
                    type: 'select',
                    options: [
                        { value: '', label: '請選擇' },
                        { value: '男', label: '男' },
                        { value: '女', label: '女' }
                    ]
                },
                {
                    id: 'howMet',
                    label: '如何認識對方',
                    type: 'text'
                },
                {
                    id: 'personality',
                    label: '人格特質',
                    type: 'text'
                },
                {
                    id: 'familyStatus',
                    label: '家庭狀況',
                    type: 'text'
                },
                {
                    id: 'children',
                    label: '子女數量/年齡',
                    type: 'text'
                },
                {
                    id: 'occupation',
                    label: '職業/收入/上班型態/時間',
                    type: 'text'
                },
                {
                    id: 'leisure',
                    label: '休閒娛樂',
                    type: 'text'
                },
                {
                    id: 'financialStatus',
                    label: '財務狀況',
                    type: 'text'
                },
                {
                    id: 'healthStatus',
                    label: '健康狀況',
                    type: 'text'
                },
                {
                    id: 'futureExpectations',
                    label: '對未來的期待',
                    type: 'text'
                }
            ]
        },
        form: {
            title: 'FORM評估',
            fields: [
                {
                    id: 'formF',
                    label: 'F (家庭狀況)',
                    type: 'select',
                    options: [
                        { value: '0', label: '沒有' },
                        { value: '3', label: '接觸過' },
                        { value: '5', label: '專業' }
                    ],
                    required: true
                },
                {
                    id: 'formO',
                    label: 'O (職業收入)',
                    type: 'select',
                    options: [
                        { value: '0', label: '暫無收入需求' },
                        { value: '3', label: '收入不穩定或不滿意' },
                        { value: '5', label: '專業' }
                    ],
                    required: true
                },
                {
                    id: 'formR',
                    label: 'R (人際關係)',
                    type: 'select',
                    options: [
                        { value: '0', label: '沒有' },
                        { value: '3', label: '接觸過' },
                        { value: '5', label: '專業' }
                    ],
                    required: true
                },
                {
                    id: 'formM',
                    label: 'M (管理能力)',
                    type: 'select',
                    options: [
                        { value: '0', label: '沒有' },
                        { value: '3', label: '接觸過' },
                        { value: '5', label: '專業' }
                    ],
                    required: true
                },
                {
                    id: 'needs',
                    label: '需求分析',
                    type: 'checkbox-group',
                    options: [
                        { id: 'needWeightLoss', label: '減脂減重' },
                        { id: 'needSkincare', label: '保養彩妝' },
                        { id: 'needHealth', label: '健康網站' },
                        { id: 'needIncome', label: '增加收入' },
                        { id: 'needPassiveIncome', label: '永續收入' }
                    ]
                }
            ]
        },
        followup: {
            title: '跟進計劃',
            fields: [
                {
                    id: 'followupPlan',
                    label: '跟進計劃',
                    type: 'textarea',
                    rows: 3,
                    required: true
                },
                {
                    id: 'followupDate',
                    label: '執行日期',
                    type: 'date',
                    required: true
                },
                {
                    id: 'followupFeedback',
                    label: '反饋',
                    type: 'textarea',
                    rows: 3
                }
            ]
        }
    }
};

// Export the configuration
window.formConfig = formConfig; 