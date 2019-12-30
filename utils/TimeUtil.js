let TimeUtil = {
    fullTime: function(date) {
        if (!date.getMonth) {
            date = new Date(date)
            if (!date.getMonth) {
                console.log(JSON.stringify(date) + '不是一个日期')
                return null
            }
        }
        let today = new Date()
        today.setHours(23, 59, 59, 999)
        let todayStart = new Date(new Date().setHours(0, 0, 0, 0))
        let tomorrow = new Date(new Date().getTime() + 1000 * 60 * 60 * 24)
        tomorrow.setHours(23, 59, 59, 999)
        var day = ''
        if (date.getTime() < today.getTime() && date.getTime() > todayStart) {
            day = '今天'
        } else if (date.getTime() >= today.getTime() && date.getTime() < tomorrow.getTime()) {
            day = '明天'
        } else {
            day = this.toYYMMDD(date)
        }
        let hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        let min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
        return day + ' ' + hour + ':' + min
    },
    orderTime: function(date) {
        if (!date.getMonth) {
            date = new Date(date)
            if (!date.getMonth) {
                console.log(JSON.stringify(date) + '不是一个日期')
                return null
            }
        }
        let today = new Date()
        today.setHours(23, 59, 59, 999)
        let todayStart = new Date(new Date().setHours(0, 0, 0, 0))
        let tomorrow = new Date(new Date().getTime() + 1000 * 60 * 60 * 24)
        tomorrow.setHours(23, 59, 59, 999)
        var day = ''
        if (date.getTime() < today.getTime() && date.getTime() > todayStart) {
            day = '今天'
        } else if (date.getTime() >= today.getTime() && date.getTime() < tomorrow.getTime()) {
            day = '明天'
        } else {
            day = this.toMMDD(date)
        }
        let hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        let min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
        return day + ' ' + hour + ':' + min
    },
    format: function(date) {
        if (!date || !date.getMonth) {
            date = new Date(date)
            if (!date.getMonth) {
                console.log(JSON.stringify(date) + '不是一个日期')
                return null
            }
        }
        let day = this.prettyDate(date)
        let hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        let min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
        return day + ' ' + hour + ':' + min
    },
    prettyDate: function(date) {
        if (!date.getMonth) {
            date = new Date(date)
            if (!date.getMonth) {
                console.log(JSON.stringify(date) + '不是一个日期')
                return null
            }
        }
        if (!date.getMonth) {
            date = new Date(date)
            if (!date.getMonth) {
                console.log(JSON.stringify(date) + '不是一个日期')
                return null
            }
        }
        var month = date.getMonth() + 1
        month = month < 10 ? '0' + month : month
        var day = date.getDate()
        day = day < 10 ? '0' + day : day
        var workday = date.getDay()
        switch (workday) {
            case 0:
                workday = '星期日';
                break
            case 1:
                workday = '星期一';
                break
            case 2:
                workday = '星期二';
                break
            case 3:
                workday = '星期三';
                break
            case 4:
                workday = '星期四';
                break
            case 5:
                workday = '星期五';
                break
            case 6:
                workday = '星期六';
                break
        }
        return month + '月' + day + '日' + ' ' + workday
    },
    toMMDD: function(date) {
        if (!date.getMonth) {
            date = new Date(date)
            if (!date.getMonth) {
                console.log(JSON.stringify(date) + '不是一个日期')
                return null
            }
        }
        var month = date.getMonth() + 1
        month = month < 10 ? '0' + month : month
        var day = date.getDate()
        day = day < 10 ? '0' + day : day
        return month + '月' + day + '日'
    },
    toHHMM: function(date) {
        if (!date) { return null }
        if (!date.getMonth) {
            date = new Date(date)
            if (!date.getMonth) {
                console.log(JSON.stringify(date) + '不是一个日期')
                return null
            }
        }
        var hour = date.getHours()
        hour = hour < 10 ? '0' + hour : hour
        var min = date.getMinutes()
        min = min < 10 ? '0' + min : min
        return hour + ':' + min
    },
    toYYMMDD: function(date) {
        if (!date.getMonth) {
            date = new Date(date)
            if (!date.getMonth) {
                console.log(JSON.stringify(date) + '不是一个日期')
                return null
            }
        }
        var month = date.getMonth() + 1
        month = month < 10 ? '0' + month : month
        var day = date.getDate()
        day = day < 10 ? '0' + day : day
        var year = 1900 + date.getYear()
        return year + '年' + month + '月' + day + '日'
    },
    prettyTime: function(t) {
        if (!t) {
            return "";
        }
        var timePast = (Date.parse(new Date()) - Date.parse(t)) / 1000
        if (timePast < 0) {
            var timeAfter = -1 * timePast
            if (timeAfter < 60) {
                return "1分钟内";
            } else if (timeAfter < 60 * 60) {
                return Math.floor(timeAfter / (60)) + "分钟内";
            } else if (timeAfter < 24 * 60 * 60) {
                return Math.floor(timeAfter / (60 * 60)) + "小时内";
            } else if (timeAfter < 7 * 24 * 60 * 60) {
                return Math.floor(timeAfter / (24 * 60 * 60)) + "天内";
            } else if (timeAfter < 30 * 24 * 60 * 60) {
                return Math.floor(timeAfter / (7 * 24 * 60 * 60)) + "周内";
            } else if (timeAfter < 365 * 24 * 60 * 60) {
                return Math.floor(timeAfter / (30 * 24 * 60 * 60)) + "个月内";
            } else if (timeAfter < 36500 * 24 * 60 * 60) {
                return Math.floor(timeAfter / (365 * 24 * 60 * 60)) + "年内";
            } else {
                return "N年后";
            }
        }
        if (timePast < 60) {
            return "刚刚";
        } else if (timePast < 60 * 60) {
            return Math.floor(timePast / (60)) + "分钟前";
        } else if (timePast < 24 * 60 * 60) {
            return Math.floor(timePast / (60 * 60)) + "小时前";
        } else if (timePast < 7 * 24 * 60 * 60) {
            return Math.floor(timePast / (24 * 60 * 60)) + "天前";
        } else if (timePast < 30 * 24 * 60 * 60) {
            return Math.floor(timePast / (7 * 24 * 60 * 60)) + "周前";
        } else if (timePast < 365 * 24 * 60 * 60) {
            return Math.floor(timePast / (30 * 24 * 60 * 60)) + "个月前";
        } else if (timePast < 36500 * 24 * 60 * 60) {
            return Math.floor(timePast / (365 * 24 * 60 * 60)) + "年前";
        } else {
            return "N年前";
        }
    },
    left: function(time) {
        let now = new Date()
        now.setHours(23)
        now.setMinutes(59)
        now.setSeconds(59)
        now.setMilliseconds(999)

        time.setHours(23)
        time.setMinutes(59)
        time.setSeconds(59)
        time.setMilliseconds(999)
        return (time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    }
}

module.exports = TimeUtil