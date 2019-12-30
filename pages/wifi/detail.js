const TimeUtil = require("../../utils/TimeUtil.js")
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        qrcode: null,
        tab: 1,
        form: {}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        that.data.qrcodeId = options.qrcodeId

        //DEBUG local
        // that.data.qrcodeId = '5c9353abeb6b163f76d87de0'

        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/wifi/detail/load',
            data: { qrcodeId: that.data.qrcodeId },
            method: 'POST',
            success: function(res) {
                let qrcode = res.data.qrcode
                let user = res.data.user
                let connects = res.data.connects
                for (let connect of connects) {
                    connect.createTimeStr = TimeUtil.orderTime(connect.createTime)
                }
                let data = {
                    session: that.data.session,
                    qrcode: qrcode || null,
                    user: user || null,
                    connects: connects
                }
                if (qrcode.location) {
                    data.markers = [{
                        iconPath: '/res/images/location-3.png',
                        latitude: qrcode.location[1],
                        longitude: qrcode.location[0],
                        width: 30,
                        height: 30,
                    }]
                }
                that.setData(data)
                if (cb) cb()
            },
        })
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        this.loadData(function() {
            wx.stopPullDownRefresh()
        })
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

    tabChanged: function(e) {
        let that = this
        let tab = e.currentTarget.dataset.tab
        that.setData({
            'tab': tab
        })
        that.loadData()
    },

    toSetSSID: function() {
        let that = this
        that.setData({ SSIDModal: true, connecting: true })
        wx.getConnectedWifi({
            success: function(res) {
                that.setData({
                    connecting: false,
                    connectedWifi: res.wifi,
                    'form.SSID': res.wifi.SSID,
                })
            },
            fail: function(e) {
                that.setData({ connecting: false, error: e.errMsg })
            }
        })
    },
    hideSSIDModal: function() {
        let that = this
        that.setData({ SSIDModal: false })
    },
    doNothing: function() {
        let that = this

    },
    doSave: function(form, cb) {
        let that = this
        if (form.SSID) {
            form['wifi.SSID'] = form.SSID
            delete form.SSID
        }
        if (form.password) {
            form['wifi.password'] = String(form.password)
            delete form.password
        }
        getApp().request({
            url: '/userapp/wifi/detail/update',
            data: { qrcodeId: that.data.qrcodeId, form: form },
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    wx.showToast({
                        title: '保存成功',
                        icon: 'none'
                    })
                    that.loadData()
                    that.setData({ SSIDModal: false, fieldModal: false, addressModal: false })
                }
                if (cb) cb()
            },
        })
    },
    saveSSID: function() {
        let that = this
        that.doSave({ SSID: that.data.form.SSID, password: that.data.form.password })
    },
    saveAddress: function() {
        let that = this
        that.doSave({ address: that.data.form.address, location: that.data.form.location })
    },
    fieldSave: function(e) {
        let that = this
        let field = e.currentTarget.dataset.field
        let value = that.data.form[field]
        let form = {}
        form[field] = value
        if (field == 'address') {
            form['location'] = that.data.form.location
        }
        that.doSave(form)
    },
    showFieldModal: function(e) {
        let that = this
        let title = e.currentTarget.dataset.title
        let value = e.currentTarget.dataset.value
        let field = e.currentTarget.dataset.field
        that.setData({ fieldModal: { title: title, value: value, field: field } })
    },
    hideFieldModal: function() {
        let that = this
        that.setData({ fieldModal: null })
    },

    valueChanged: function(e) {
        let that = this
        let value = e.detail.value
        let field = e.currentTarget.dataset.field
        // if (value != "" && !isNaN(Number(value))) {
        //     value = Number(value)
        // }
        that.data.form[field] = value
    },
    toSetPassword: function() {
        let that = this
        that.setData({ passwordModal: true })
    },
    hideSetPassword: function() {
        let that = this
        that.setData({ passwordModal: false })
    },

    // toLocation: function() {
    //     let that = this
    //     if (!that.data.form.address && !that.data.qrcode.address) {
    //         that.openLocation()
    //     } else {
    //         wx.showActionSheet({
    //             itemList: ['地图选择', '手动输入'],
    //             success: function(r) {
    //                 if (r.tapIndex == 0) {
    //                     that.openLocation()
    //                 } else if (r.tapIndex == 1) {
    //                     that.setData({ fieldModal: { title: '店铺地址', value: that.data.form.address || that.data.qrcode.address, field: 'address' } })
    //                 }
    //             }
    //         })
    //     }
    // },

    openLocation: function() {
        let that = this
        wx.chooseLocation({
            success: function(res) {
                let location = [res.longitude, res.latitude]
                let address = that.data.form.address || res.address
                that.setData({
                    'form.address': address,
                    'form.location': location,
                    fieldModal: { title: '店铺地址', value: address, field: 'address' }
                })
            },
            fail: function(res) {
                if (res.errMsg == "chooseLocation:fail auth deny") {
                    wx.openSetting({
                        success: function(res) {
                            console.log(res)
                        },
                    })
                }
            }
        })
    },
    switchChanged: function(e) {
        let that = this
        let field = e.currentTarget.dataset.field
        let form = {}
        form[field] = e.detail.value
        if (field == 'requirePhone' && e.detail.value) {
            form['requireNickname'] = false
        } else if (field == 'requireNickname' && e.detail.value) {
            form['requirePhone'] = false
        }
        that.doSave(form)
    },

    uploadAdImage: function() {
        let that = this
        wx.chooseImage({
            success(res) {
                const tempFilePaths = res.tempFilePaths
                that.setData({
                    uploadingImage: {
                        url: tempFilePaths[0]
                    },
                    uploadedImage: null,
                })
                wx.showLoading({
                    title: ''
                })
                getApp().loadUploadToken(function(token) {
                    that.data.uploadToken = token
                    that.upload(function() {
                        that.doSave({ adImage: that.data.uploadedImage.url })
                    }, )
                })
            }
        })
    },
    upload: function(cb) {
        let that = this
        let uploadingFile = wx.uploadFile({
            url: 'https://upload.qiniup.com/',
            filePath: that.data.uploadingImage.url,
            name: 'file',
            header: {
                'content-type': 'multipart/form-data'
            },
            formData: {
                token: that.data.uploadToken
            },
            success: function(res) {
                // wx.showToast({ title: '', })
                wx.hideLoading()
                let data = JSON.parse(res.data)
                that.setData({
                    uploadingImage: null,
                    uploadedImage: {
                        url: 'http://cdn.vlite.pro/' + data.hash
                    }
                })
                if (cb) cb()
            },
            fail: function(res) {
                console.log(res)
                wx.hideLoading()
            },
        })

        uploadingFile.onProgressUpdate((res) => {
            console.log(res)
        })
    },

    modifyAdImage: function() {
        let that = this
        wx.showActionSheet({
            itemList: ['查看', '重新选择', '删除'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    wx.previewImage({
                        current: that.data.qrcode.adImage,
                        urls: [that.data.qrcode.adImage]
                    })
                } else if (r.tapIndex == 1) {
                    that.uploadAdImage()
                } else if (r.tapIndex == 2) {
                    that.doSave({ adImage: null })
                }
            }
        })
    },

    toUnbind: function() {
        let that = this
        that.setData({ unbindModal: true })
    },
    hideUnbind: function() {
        let that = this
        that.setData({ unbindModal: false })
    },
    unbind: function() {
        let that = this
        getApp().request({
            url: '/userapp/wifi/qrcode/unbind',
            data: {
                qrcodeId: that.data.qrcodeId
            },
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    wx.reLaunch({ url: '/pages/wifi/qrcode?qrcodeId=' + that.data.qrcodeId })
                }
            },
        })
    },
    showQrcode: function() {
        let that = this
        wx.previewImage({
            current: that.data.qrcode.url,
            urls: [that.data.qrcode.url],
            success: function() {
                wx.hideLoading()
            }
        })
    },
})