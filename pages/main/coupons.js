const TimeUtil = require("../../utils/TimeUtil.js")
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        user: null,
        tab: 0,
        activeIndex: 0,
        changeNavConfirm: true,
        navs: [
            { name: '全部', type: 0 },
            { name: '即将过期', type: 4 },
            { name: '未使用', type: 1 },
            { name: '已使用', type: 2 },
            { name: '已过期', type: 3 }
        ],
        query: {
            keywords: '',
            from: null,
            size: 20
        },
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        if (that.data.loading) return
        that.setData({ loading: true })
        getApp().request({
            url: '/userapp/main/coupons/load',
            data: { tab: that.data.tab, query: that.data.query },
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let usercoupons = res.data.usercoupons
                if (that.data.query.from) {
                    that.data.query.from = null
                    usercoupons = that.data.usercoupons.concat(usercoupons)
                }
                for (let usercoupon of usercoupons) {
                    usercoupon.coupon.valueStr = Number(usercoupon.coupon.value || 0).toFixed(2)
                    if (usercoupon.expiryTime) {
                        usercoupon.expiryTimeStr = TimeUtil.orderTime(usercoupon.expiryTime) + '前有效'
                        let currentTime = new Date().getTime()
                        let couponTime = new Date(usercoupon.expiryTime).getTime()
                        if ((couponTime - currentTime) < 1000 * 60 * 60 * 24 * 10) {
                            usercoupon.dateWarnning = true
                        }
                        if ((couponTime - currentTime) <= 0) {
                            usercoupon.dateExpiry = true
                            usercoupon.dateWarnning = false
                        }
                    }
                    if (usercoupon.coupon.condition) {
                        usercoupon.coupon.condition = usercoupon.coupon.condition * 1
                    } else {
                        usercoupon.coupon.condition = null
                    }
                    usercoupon.coupon.discountStr = usercoupon.coupon.discount / 10
                }
                let nomore = (res.data.usercoupons && res.data.usercoupons.length < that.data.query.size) ? true : false
                that.setData({
                    session: that.data.session,
                    user: user || null,
                    usercoupons: usercoupons,
                    loading: false,
                    loadingmore: false,
                    changeNavConfirm: true,
                    nomore,
                })
                if (cb) cb()
            },
        })
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        if (this.data.session) {
            this.loadData(function() {
                wx.stopPullDownRefresh()
            })
        }
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        let that = this
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.usercoupons.length == 0) {
            return
        }
        that.data.query.from = that.data.usercoupons[that.data.usercoupons.length - 1].createTime
        that.setData({
            loadingmore: true
        })
        that.loadData()
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    },

    handleSearchInputChange(e) {
        let keywords = e.detail.keywords
        this.data.query.keywords = keywords
    },
    handleSearch() {
        let that = this
        that.setData({
            usercoupons: [],
            'query.keywords': that.data.query.keywords
        })
        that.loadData()
    },
    handleChangeNav(e) {
        this.setData({
            activeIndex: e.detail.index,
            tab: e.detail.item.type,
            changeNavConfirm: false
        })
        this.loadData()
    },
    toDetail: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        wx.navigateTo({
            url: '/pages/coupon/detail?couponId=' + item.coupon._id + '&usercouponId=' + item._id
        })
    },
})