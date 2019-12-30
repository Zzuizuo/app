const date = new Date()
let currentYear = date.getFullYear()
let currentMonth = date.getMonth()
let currentDate = date.getDate()
let currentMonthOfDate = new Date(currentYear, currentMonth + 1, 0).getDate()
let currentHour = date.getHours()
let currentMinute = date.getMinutes()

Component({
    behaviors: [],
    properties: {},
    data: {
        years: getArr(currentYear + 1, [], 2019),
        year: 1,
        months: getArr(12, [], 1),
        month: currentMonth,
        days: getArr(currentMonthOfDate, [], 1),
        day: currentDate,
        hours: getArr(23, [], 0),
        hour: 0,
        minutes: getArr(59, [], 0),
        minute: 0,
        value: [0, currentMonth, currentDate - 1, currentHour, currentMinute],
        tagDayAmount: 0,
    }, // 私有数据，可用于模板渲染

    lifetimes: {
        // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
        attached: function() {},
        moved: function() {},
        detached: function() {},
    },
    pageLifetimes: {
        // 组件所在页面的生命周期函数
        show: function() {},
        hide: function() {},
        resize: function() {},
    },

    methods: {
        bindChange: function(e) {
            const val = e.detail.value
            let year = this.data.years[val[0]]
            let month = this.data.months[val[1]]
            let day = this.data.days[val[2]]
            let hour = this.data.hours[val[3]]
            let minute = this.data.minutes[val[4]]
            let dayAmount = getMonthOfDate(year, month)
            this.setData({
                year: year,
                month: month,
                day: day,
                hour: hour,
                minute: minute,
                days: getArr(dayAmount, [], 1),
                value: val
            })
        },
        handleCancle() {
            this.triggerEvent('cancel')
        },
        handleConfirm() {
            const val = this.data.value
            let time = {
                year: this.data.years[val[0]],
                month: this.data.months[val[1]],
                day: this.data.days[val[2]],
                hour: this.data.hours[val[3]],
                minute: this.data.minutes[val[4]],
            }
            this.triggerEvent('gettime', { time: time })
        }
    }

})

function getArr(amount, arr, num) {
    for (let i = num; i <= amount; i++) {
        arr.push(i)
    }
    return arr
}

function getMonthOfDate(year, month) {
    return new Date(year, month, 0).getDate()
}