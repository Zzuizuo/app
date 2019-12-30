const TimeUtil = require("../../utils/TimeUtil.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    session: null,
    usersession: null,
    user: null,
    messages: null,
    query: {
      keywords: '',
      from: null,
      size: 20
    },
    loading: false,
    loadingmore: false,
    nomore: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    let usersessionId = options.usersessionId
    if (usersessionId) {
      that.data.usersession = {
        _id: usersessionId
      }
    }
    getApp().loadSession(function (session) {
      that.data.session = session
      that.loadData()
    })
  },

  loadData: function (cb) {
    let that = this
    if (that.data.loading) {
      return
    }
    that.setData({
      loading: true
    })
    getApp().request({
      url: '/userapp/contact/messages/load',
      data: {
        usersessionId: that.data.usersession._id
      },
      method: 'POST',
      success: function (res) {
        let usersession = res.data.usersession
        let user = res.data.user
        let messages = res.data.messages
        messages.reverse()
        for (let message of messages) {
          message.createTimeStr = TimeUtil.prettyTime(message.createTime)
        }
        if (that.data.query.from) {
          that.data.query.from = null
          messages = that.data.messages.concat(messages)
        }
        that.setData({
          session: that.data.session,
          usersession: usersession || null,
          user: user || null,
          messages: messages || null,
          loadingmore: false,
          nomore: (res.data.messages.length < that.data.query.size) ? true : false,
        })
        setTimeout(() => {
          that.setData({
            loading: false,
          })
          wx.pageScrollTo({
            scrollTop: 999999,
            success: function () {
              console.log('scroll success')
            },
            fail: function () {
              console.log('scroll fail')
            }
          })
        }, 1000);
        if (cb) cb()
      },
    })
  },
  inputSubmit: function (e) {
    let that = this
    console.log(e)
    if (e && e.detail.value) {
      that.data.content = e.detail.value
    }
    that.submit()
  },
  formSubmit: function (e) {
    let that = this
    console.log(e)
    if (e && e.detail.value && e.detail.value.content) {
      that.data.content = e.detail.value.content
    }
    that.submit()
  },
  submit: function () {
    let that = this
    if (that.data.loading) {
      return
    }
    that.setData({
      loading: true,
    })
    getApp().request({
      url: '/userapp/contact/messages/submit',
      data: {
        content: that.data.content,
        usersessionId: that.data.usersession._id
      },
      method: 'POST',
      success: function (res) {
        that.data.loading = false
        if (res.data.success) {
          that.setData({
            content: null
          })
          that.loadData()
          getApp().dataUpdated = true
        } else {
          that.setData({
            loading: false
          })
        }
      },
      fail: function () {
        that.setData({
          loading: false
        })
      }
    })
  },
  toReply: function () {
    let that = this
    if (that.data.loading) {
      return
    }
    that.data.loading = true
    wx.showLoading({
      title: ''
    })
    getApp().request({
      url: '/userapp/contact/messages/connect',
      data: {
        usersessionId: that.data.usersession._id
      },
      method: 'POST',
      success: function (res) {
        that.data.loading = false;
        wx.showToast({
          title: '',
        })
        if (res.data.success) {
          that.setData({
            'usersession': res.data.usersession
          })
          wx.showToast({
            title: '接入成功',
            icon: 'none'
          })
        } else {
          wx.showToast({
            title: res.data.error,
            icon: 'none'
          })
          that.setData({
            'usersession': res.data.usersession
          })
        }
      },
      fail: function () {
        that.data.loading = false;
        wx.hideLoading()
      }
    })
  },
  exitConnect: function () {
    let that = this
    if (that.data.loading) {
      return
    }
    that.data.loading = true
    wx.showLoading({
      title: ''
    })
    getApp().request({
      url: '/userapp/contact/messages/exitConnect',
      data: {
        usersessionId: that.data.usersession._id
      },
      method: 'POST',
      success: function (res) {
        that.data.loading = false;
        wx.showToast({
          title: '',
        })
        if (res.data.success) {
          that.setData({
            'usersession': res.data.usersession
          })
          wx.showToast({
            title: '已退出',
            icon: 'none'
          })
        } else {
          wx.showToast({
            title: res.data.error,
            icon: 'none'
          })
          that.setData({
            'usersession': res.data.usersession
          })
        }
      },
      fail: function () {
        that.data.loading = false;
        wx.hideLoading()
      }
    })
  },
  setRead: function () {
    let that = this
    if (that.data.loading) {
      return
    }
    that.data.loading = true
    wx.showLoading({
      title: ''
    })
    getApp().request({
      url: '/userapp/contact/messages/read',
      data: {
        usersessionId: that.data.usersession._id
      },
      method: 'POST',
      success: function (res) {
        that.data.loading = false;
        wx.showToast({
          title: '',
        })
        if (res.data.success) {
          getApp().dataUpdated = true
        }
      },
      fail: function () {
        that.data.loading = false;
        wx.hideLoading()
      }
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.loadData(function () {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // let that = this
    // if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.messages.length == 0) {
    //   return
    // }
    // that.data.query.from = that.data.messages[that.data.messages.length - 1].createTime
    // that.setData({ loadingmore: true })
    // that.loadData()
  },

  previewImage: function (e) {
    let that = this
    let item = e.currentTarget.dataset.item
    let image = item.image
    wx.previewImage({
      current: image,
      urls: [image]
    })

  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  refreshData: function () {
    let that = this
    that.loadData()
  },
})