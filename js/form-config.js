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
                }
            ]
        },
        formhd: {
            title: 'FORMHD評估',
            subsections: {
                family: {
                    title: 'F - 家庭狀況',
                    fields: [
                        {
                            id: 'formF',
                            label: 'F - 家庭狀況',
                            type: 'text',
                            required: true,
                            placeholder: '請輸入家庭狀況'
                        },
                        {
                            id: 'formFSpouse',
                            label: '另一半職業',
                            type: 'text',
                            required: false
                        },
                        {
                            id: 'formFChildren',
                            label: '子女數量/年齡',
                            type: 'text',
                            required: false
                        },
                        {
                            id: 'formFEducation',
                            label: '就學/就業',
                            type: 'text',
                            required: false
                        },
                        {
                            id: 'formFFamily',
                            label: '家中成員/寵物',
                            type: 'text',
                            required: false
                        },
                        {
                            id: 'formFShopping',
                            label: '喜歡線上購物',
                            type: 'checkbox',
                            required: false
                        },
                        {
                            id: 'formFSaving',
                            label: '喜歡省錢',
                            type: 'checkbox',
                            required: false
                        },
                        {
                            id: 'formFNeedMoney',
                            label: '需要錢嗎',
                            type: 'checkbox',
                            required: false
                        }
                    ]
                },
                occupation: {
                    title: 'O - 職業',
                    fields: [
                        {
                            id: 'formO',
                            label: 'O - 職業',
                            type: 'text',
                            required: true,
                            placeholder: '請輸入職業'
                        },
                        {
                            id: 'formOIncome',
                            label: '收入',
                            type: 'text',
                            required: false
                        },
                        {
                            id: 'formOWorkType',
                            label: '上班型態',
                            type: 'text',
                            required: false
                        },
                        {
                            id: 'formOTime',
                            label: '時間',
                            type: 'text',
                            required: false
                        }
                    ]
                },
                recreation: {
                    title: 'R - 休閒娛樂',
                    fields: [
                        {
                            id: 'formR',
                            label: 'R - 休閒娛樂',
                            type: 'text',
                            required: true,
                            placeholder: '請輸入休閒娛樂'
                        },
                        {
                            id: 'formRDrink',
                            label: '喜歡喝茶/咖啡',
                            type: 'checkbox',
                            required: false
                        },
                        {
                            id: 'formRMakeup',
                            label: '喜歡化妝',
                            type: 'checkbox',
                            required: false
                        }
                    ]
                },
                money: {
                    title: 'M - 財務狀況',
                    fields: [
                        {
                            id: 'formM',
                            label: 'M - 財務狀況',
                            type: 'text',
                            required: true,
                            placeholder: '請輸入財務狀況'
                        },
                        {
                            id: 'formMNoTime',
                            label: '賺很多錢沒時間花',
                            type: 'checkbox',
                            required: false
                        }
                    ]
                },
                health: {
                    title: 'H - 健康狀況',
                    fields: [
                        {
                            id: 'formH',
                            label: 'H - 健康狀況',
                            type: 'text',
                            required: false,
                            placeholder: '請輸入健康狀況'
                        },
                        {
                            id: 'formHExercise',
                            label: '運動狀況',
                            type: 'text',
                            required: false
                        },
                        {
                            id: 'formHWeight',
                            label: '需要減重',
                            type: 'checkbox',
                            required: false
                        }
                    ]
                },
                dream: {
                    title: 'D - 對未來的期待',
                    fields: [
                        {
                            id: 'formD',
                            label: 'D - 對未來的期待',
                            type: 'text',
                            required: false,
                            placeholder: '請輸入對未來的期待'
                        }
                    ]
                }
            },
            fields: [
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