Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        user: null,
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
        getApp().request({
            url: '/userapp/admin/setting/load',
            data: {},
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                that.setData({
                    session: that.data.session,
                    user: user || null,
                    env: getApp().env
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

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    },
    openDebug: function() {
        let that = this
        wx.showLoading({ title: '' })
        wx.setEnableDebug({
            enableDebug: true,
            complete: function() {
                wx.showToast({
                    title: '',
                })
            }
        })
    },
    closeDebug: function() {
        let that = this
        wx.showLoading({ title: '' })
        wx.setEnableDebug({
            enableDebug: false,
            complete: function() {
                wx.showToast({
                    title: '',
                })
            }
        })
    },
    setDevelop: function() {
        let that = this
        wx.showModal({
            title: '切换到体验服数据库',
            content: '将重启应用',
            success: function(r) {
                if (r.confirm) {
                    wx.setStorageSync('env', 'develop')
                    getApp().env = 'develop'
                    getApp().apibase = "http://local.classx.cn/tandian/api"
                    getApp().session = null
                    wx.reLaunch({ url: '/pages/main/index' })
                }
            },
        })
    },
    setTrial: function() {
        let that = this
        if (getApp().env == 'develop') {
            wx.showModal({
                title: '切换失败',
                content: '当前是本地服环境，拥有最高优先级',
            })
            return
        }
        wx.showModal({
            title: '切换到体验服数据库',
            content: '将重启应用',
            success: function(r) {
                if (r.confirm) {
                    wx.setStorageSync('env', 'trial')
                    getApp().env = 'trial'
                    getApp().apibase = "https://test.classx.cn/tandian/api"
                    getApp().session = null
                    wx.reLaunch({ url: '/pages/main/index' })
                }
            },
        })
    },
    setRelease: function() {
        let that = this
        if (getApp().env == 'develop') {
            wx.showModal({
                title: '切换失败',
                content: '当前是本地服环境，拥有最高优先级',
            })
            return
        }
        wx.showModal({
            title: '切换到正式服数据库',
            content: '将重启应用',
            success: function(r) {
                if (r.confirm) {
                    wx.setStorageSync('env', 'release')
                    getApp().env = 'release'
                    getApp().apibase = "https://app.classx.cn/tandian/api"
                    getApp().session = null
                    wx.reLaunch({ url: '/pages/main/index' })
                }
            },
        })
    },
    resetAccount: function() {
        let that = this
        wx.showModal({
            title: '慎用',
            content: '将作为新账号登陆，清空所有信息',
            success: function(r) {
                if (r.confirm) {
                    getApp().request({
                        url: '/userapp/session/resetAccount',
                        data: {},
                        method: 'POST',
                        success: function(res) {
                            getApp().session = null
                            wx.reLaunch({ url: '/pages/main/index' })
                        },
                    })
                }
            },
        })
    },
    revertAccount: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/admin/accounts'
        })
    },
    toMockAccount: function() {
        let that = this
        if (!that.data.user.super) { return }
        wx.navigateTo({
            url: '/pages/admin/users?selection=true'
        })
    },
    toContacts: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/contact/usersessions'
        })
    },
    toWifi: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/wifi/index'
        })
    },
    debugQrCode: function() {
        let that = this
        wx.scanCode({
            success(res) {
                console.log(res)
                if (res.path) {
                    if (res.path.indexOf('pages/main/index') != -1) {
                        getApp().debugScene = res.path.substring(res.path.indexOf('scene=') + 6, res.path.length)
                        wx.reLaunch({
                            url: '/pages/main/index'
                        })
                    } else {
                        wx.navigateTo({
                            url: '/' + res.path
                        })
                    }
                }
            }
        })
    },
})