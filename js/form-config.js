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
                    type: 'number',
                    min: 0,
                    max: 120,
                    highlight: {
                        min: 30,
                        max: 55
                    }
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
        step2: {
            title: 'Step 2 資料',
            fields: [
                {
                    id: 'maritalStatus',
                    label: '婚姻狀況',
                    type: 'select',
                    options: [
                        { value: '', label: '請選擇' },
                        { value: '已婚', label: '已婚' },
                        { value: '單身', label: '單身' },
                        { value: '離婚', label: '離婚' },
                        { value: '喪偶', label: '喪偶' }
                    ]
                },
                {
                    id: 'annualIncome',
                    label: '年收入',
                    type: 'select',
                    options: [
                        { value: '', label: '請選擇' },
                        { value: '50萬以下', label: '50萬以下' },
                        { value: '50-100萬', label: '50-100萬' },
                        { value: '100-150萬', label: '100-150萬' },
                        { value: '150-200萬', label: '150-200萬' },
                        { value: '200萬以上', label: '200萬以上' }
                    ]
                },
                {
                    id: 'moneyNeeds',
                    label: '金錢需求',
                    type: 'textarea',
                    rows: 3
                },
                {
                    id: 'relationship',
                    label: '關係',
                    type: 'text'
                },
                {
                    id: 'relationshipCloseness',
                    label: '關係親疏',
                    type: 'select',
                    options: [
                        { value: '', label: '請選擇' },
                        { value: '非常親近', label: '非常親近' },
                        { value: '親近', label: '親近' },
                        { value: '普通', label: '普通' },
                        { value: '疏遠', label: '疏遠' },
                        { value: '非常疏遠', label: '非常疏遠' }
                    ]
                },
                {
                    id: 'colorRating',
                    label: '顏色評級',
                    type: 'select',
                    options: [
                        { value: '', label: '請選擇' },
                        { value: 'red', label: '紅色' },
                        { value: 'yellow', label: '黃色' },
                        { value: 'green', label: '綠色' }
                    ]
                },
                {
                    id: 'productInterest',
                    label: '對產品興趣',
                    type: 'select',
                    options: [
                        { value: '', label: '請選擇' },
                        { value: '高', label: '高' },
                        { value: '中', label: '中' },
                        { value: '低', label: '低' },
                        { value: '無', label: '無' }
                    ]
                },
                {
                    id: 'interests',
                    label: '興趣',
                    type: 'textarea',
                    rows: 3
                },
                {
                    id: 'health',
                    label: '健康狀況',
                    type: 'textarea',
                    rows: 3
                },
                {
                    id: 'dreams',
                    label: '夢想',
                    type: 'textarea',
                    rows: 3
                },
                {
                    id: 'lastInviteDate',
                    label: '最近邀約日期',
                    type: 'date'
                },
                {
                    id: 'lastPresentationDate',
                    label: '產品/事業展示日期',
                    type: 'date'
                },
                {
                    id: 'firstFollowUp',
                    label: '第一次跟進',
                    type: 'textarea',
                    rows: 3
                },
                {
                    id: 'secondFollowUp',
                    label: '第二次跟進',
                    type: 'textarea',
                    rows: 3
                },
                {
                    id: 'notes',
                    label: '備注',
                    type: 'textarea',
                    rows: 3
                }
            ]
        },
        steam: {
            title: 'STEAM評估',
            fields: [
                {
                    id: 'listOwner',
                    label: 'List Owner',
                    type: 'text',
                    required: false
                },
                {
                    id: 'joinDate',
                    label: '加入名單日期',
                    type: 'date',
                    required: false
                },
                {
                    id: 'steamS',
                    label: 'S (有銷售服務經驗)',
                    type: 'select',
                    options: [
                        { value: '0', label: '0 - 沒有' },
                        { value: '3', label: '3 - 接觸過' },
                        { value: '5', label: '5 - 專業' }
                    ],
                    required: false
                },
                {
                    id: 'steamT',
                    label: 'T (指導教練或輔導員)',
                    type: 'select',
                    options: [
                        { value: '0', label: '0 - 沒有' },
                        { value: '3', label: '3 - 接觸過' },
                        { value: '5', label: '5 - 專業' }
                    ],
                    required: false
                },
                {
                    id: 'steamE',
                    label: 'E (創業家或事業經驗)',
                    type: 'select',
                    options: [
                        { value: '0', label: '0 - 沒有' },
                        { value: '3', label: '3 - 曾經或剛起步' },
                        { value: '5', label: '5 - 正在創業或有自己生意' }
                    ],
                    required: false
                },
                {
                    id: 'steamA',
                    label: 'A (態度積極並具個人魅力)',
                    type: 'select',
                    options: [
                        { value: '0', label: '0 - 安於現狀' },
                        { value: '3', label: '3 - 願意改變' },
                        { value: '5', label: '5 - 態度積極勇於嘗試' }
                    ],
                    required: false
                },
                {
                    id: 'steamM',
                    label: 'M (個人收入及希望達到收入目標)',
                    type: 'select',
                    options: [
                        { value: '0', label: '0 - 暫無收入需求，安於現狀' },
                        { value: '3', label: '3 - 收入不穩定或急需增加收入' },
                        { value: '5', label: '5 - 收入穩定，想創造額外收入' }
                    ],
                    required: false
                },
                {
                    id: 'onlineSales',
                    label: '網路銷售經驗',
                    type: 'select',
                    options: [
                        { value: '0', label: '0 - 沒有' },
                        { value: '3', label: '3 - 接觸過' },
                        { value: '5', label: '5 - 專業' }
                    ],
                    required: false
                },
                {
                    id: 'connections',
                    label: '人脈關係',
                    type: 'select',
                    options: [
                        { value: '0', label: '0 - 除了少數家人沒有太多社交' },
                        { value: '3', label: '3 - 交友圈侷限特定族群但願意交朋友' },
                        { value: '5', label: '5 - 廣結善緣/家族龐大/花蝴蝶等級' }
                    ],
                    required: false
                },
                {
                    id: 'totalScore',
                    label: '總分',
                    type: 'number',
                    readonly: true
                },
                {
                    id: 'isStep2',
                    label: 'Step 2 客戶',
                    type: 'checkbox',
                    required: false
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
                            required: false,
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
                            label: '職業',
                            type: 'text',
                            required: false,
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
                            label: '休閒娛樂',
                            type: 'text',
                            required: false,
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
                            label: '財務狀況',
                            type: 'text',
                            required: false,
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
                            label: '健康狀況',
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
        evaluation: {
            title: '客戶評估',
            fields: [
                {
                    id: 'hasCard',
                    label: '是否持有信用卡',
                    type: 'checkbox',
                    required: false
                },
                {
                    id: 'joinFee',
                    label: '加盟金',
                    type: 'textarea',
                    rows: 3,
                    required: false
                },
                {
                    id: 'maKnowledge',
                    label: '對美安的認知',
                    type: 'textarea',
                    rows: 3,
                    required: false
                },
                {
                    id: 'questions',
                    label: '興趣/疑惑/異議問題',
                    type: 'textarea',
                    rows: 3,
                    required: false
                },
                {
                    id: 'discussedMA',
                    label: '是否談過美安概念',
                    type: 'checkbox',
                    required: false
                },
                {
                    id: 'features',
                    label: '已介紹功能',
                    type: 'checkbox-group',
                    options: [
                        { id: 'featureWebsite', label: '網站導覽' },
                        { id: 'featureConsumption', label: '消費轉移' },
                        { id: 'featureAnnuity', label: '購物年金' },
                        { id: 'featurePlatform', label: '五贏平台' },
                        { id: 'featureMPCP', label: 'ＭＰＣＰ' }
                    ]
                },
                {
                    id: 'triedProduct',
                    label: '是否試用產品',
                    type: 'checkbox',
                    required: false
                },
                {
                    id: 'usingProduct',
                    label: '是否使用產品',
                    type: 'checkbox',
                    required: false
                },
                {
                    id: 'customerNeeds',
                    label: '對方需求',
                    type: 'checkbox-group',
                    options: [
                        { id: 'needVIP', label: '成為優惠顧客' },
                        { id: 'needGroupBuy', label: '揪團購物' },
                        { id: 'needHealthBody', label: '身體健康' }
                    ]
                }
            ]
        },
        followup: {
            title: '跟進計劃',
            type: 'list',
            addButtonText: '新增跟進計劃',
            itemFields: [
                {
                    id: 'discussionDate',
                    label: '討論日期',
                    type: 'date',
                    required: true
                },
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
                    required: false
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