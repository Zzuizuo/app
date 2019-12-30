const NumberUtil = require("../../utils/NumberUtil.js")
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
            { name: '进行中', type: 1 },
            { name: '已完成', type: 2 },
            // { name: '朋友的', type: 3 }
        ],
        query: {
            keywords: '',
            from: null,
            size: 20
        },
        userkanjias: {}
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
            url: '/userapp/main/kanjias/load',
            data: { tab: that.data.tab, query: that.data.query },
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let userkanjias = res.data.userkanjias
                if (that.data.query.from) {
                    that.data.query.from = null
                    userkanjias = that.data.userkanjias.concat(userkanjias)
                }
                if (userkanjias) {
                    for (let userkanjia of userkanjias) {
                        userkanjia.priceStr = Number(userkanjia.price).toFixed(2)
                        if (userkanjia.kanjia.type == 'dazhe') {
                            userkanjia.priceStr = NumberUtil.toDiscount(Math.ceil(userkanjia.price))
                            userkanjia.kanjia.originPrice = 100
                            userkanjia.kanjia.targetPrice = userkanjia.kanjia.discount
                        }
                        userkanjia.kanPrice = userkanjia.kanjia.originPrice - userkanjia.price
                        userkanjia.kanPriceStr = Number(userkanjia.kanjia.originPrice - userkanjia.price).toFixed(2)
                        let expiryTime = new Date(userkanjia.createTime).getTime() + 1000 * 60 * 60 * (userkanjia.kanjia.timeLimit || 2)
                        if (expiryTime > new Date().getTime()) {
                            that.data.expiryTime = expiryTime
                        } else {
                            userkanjia.expired = true
                        }
                    }
                }

                let nomore = (res.data.userkanjias && res.data.userkanjias.length < that.data.query.size) ? true : false
                that.setData({
                    session: that.data.session,
                    user: user || null,
                    userkanjias: userkanjias,
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
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.userkanjias.length == 0) {
            return
        }
        that.data.query.from = that.data.userkanjias[that.data.userkanjias.length - 1].createTime
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
            userkanjias: [],
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
            url: '/pages/kanjia/detail?kanjiaId=' + item.kanjia._id + '&userkanjiaId=' + item._id
        })
    },

})