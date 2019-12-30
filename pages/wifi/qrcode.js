let interstitialAd = null
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        wifi: null,
        qrcode: null,
        loading: false,
        form: { showPassword: true, requireNickname: false },
        advancedWxservice: getApp().advancedWxservice
    },


    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        this.options = options
        this.doLoad()
    },
    doLoad: function() {
        let that = this
        let options = this.options
        let scene = decodeURIComponent(options.scene)
        if (scene && scene.substring(0, 'qrcode:'.length) == 'qrcode:') {
            that.data.qrcodeId = scene.substring('qrcode:'.length, scene.length)
            getApp().request({
                url: '/userapp/open/qrcode/load',
                data: { qrcodeId: that.data.qrcodeId },
                method: 'POST',
                success: function(res) {
                    if (res.data.success) {
                        let qrcode = res.data.qrcode
                        parseQrcode(qrcode, res)
                    }
                },
            })
        } else if (options.qrcodeId) {
            that.data.qrcodeId = options.qrcodeId
            getApp().request({
                url: '/userapp/open/qrcode/load',
                data: { qrcodeId: that.data.qrcodeId },
                method: 'POST',
                success: function(res) {
                    if (res.data.success) {
                        let qrcode = res.data.qrcode
                        parseQrcode(qrcode, res)
                    }
                },
            })
        } else {
            wx.switchTab({ url: '/pages/main/index' })
        }

        function parseQrcode(qrcode, res) {
            if (!qrcode) {
                return
            }
            if (qrcode.shareby) {
                getApp().shareby = qrcode.shareby
            }
            if (qrcode.channel) {
                getApp().shareby = qrcode.channel._id
                getApp().from = { wifiId: qrcode._id }
            }
            getApp().loadSession(function(session) {
                that.data.session = session
                that.loadData(function() {
                    // 在页面onLoad回调事件中创建插屏广告实例
                    if (that.data.qrcode && that.data.qrcode.wifi && that.data.qrcode.showChaping && wx.createInterstitialAd) {
                        interstitialAd = wx.createInterstitialAd({
                            adUnitId: 'adunit-83cfc680ba90e1e9'
                        })
                        setTimeout(() => {
                            // 在适合的场景显示插屏广告
                            if (interstitialAd) {
                                interstitialAd.show().catch((err) => {
                                    console.error(err)
                                })
                            }
                        }, 20000);
                    }
                }, )
            })
        }
        that.data.hide = false
    },

    loadData: function(cb) {
        let that = this
        if (that.data.loading) return
        that.data.loading = true
        getApp().request({
            url: '/userapp/wifi/qrcode/load',
            data: {
                qrcodeId: that.data.qrcodeId
            },
            method: 'POST',
            success: function(res) {
                let qrcode = res.data.qrcode
                let user = res.data.user
                that.data.user = user
                if (that.data.qrcode) {
                    that.refreshConnectedWifi()
                } else {
                    wx.startWifi({
                        success: function(res) {
                            that.data.qrcode = qrcode
                            that.refreshConnectedWifi()
                            wx.onWifiConnected(function(wifi) {
                                that.refreshConnectedWifi()
                            })
                        },
                        fail: function(res) {
                            that.setData({
                                error: res.errMsg
                            })
                        }
                    })
                }
                let expired = false
                if (qrcode.expiryTime && new Date().getTime() > new Date(qrcode.expiryTime).getTime()) {
                    expired = true
                }

                that.setData({
                    loading: false,
                    session: that.data.session,
                    user: user || null,
                    qrcode: qrcode || null,
                    expired: expired,
                })
                if (cb) cb()
            },
        })
    },

    refreshConnectedWifi: function() {
        let that = this
        wx.getConnectedWifi({
            success: function(res) {
                that.setData({
                    connectedWifi: res.wifi
                })
                if (that.data.qrcode && that.data.qrcode.wifi) {
                    if (res.wifi && res.wifi.SSID == that.data.qrcode.wifi.SSID) {
                        that.connected()
                    } else {
                        // that.connect()
                    }
                }
            },
        })
    },

    showPassword: function() {
        this.setData({
            showPassword: true
        })
    },

    valueChanged: function(e) {
        let that = this
        let value = e.detail.value
        let field = e.currentTarget.dataset.field
        that.data.form[field] = value
    },

    showPasswordChanged: function(e) {
        let that = this
        that.setData({ 'form.showPassword': e.detail.value })
    },

    requirePhoneChanged: function(e) {
        let that = this
        let data = { 'form.requirePhone': e.detail.value }
        if (e.detail.value) {
            data['form.requireNickname'] = false
        }
        that.setData(data)
    },
    requireNicknameChanged: function(e) {
        let that = this
        let data = { 'form.requireNickname': e.detail.value }
        if (e.detail.value) {
            data['form.requirePhone'] = false
        }
        that.setData(data)
    },

    showVideoChanged: function(e) {
        let that = this
        let data = { 'form.showVideo': e.detail.value }
        if (e.detail.value) {
            data['form.adImage'] = null
            data['form.showChaping'] = false
        }
        that.setData(data)
    },

    forceVideoChanged: function(e) {
        let that = this
        let data = { 'form.forceVideo': e.detail.value }
        if (e.detail.value) {
            data['form.adImage'] = null
        }
        that.setData(data)
    },
    showChapingChanged: function(e) {
        let that = this
        let data = { 'form.showChaping': e.detail.value }
        if (e.detail.value) {
            data['form.adImage'] = null
        }
        that.setData(data)
    },
    channelModeChanged: function(e) {
        let that = this
        let data = { 'form.channelMode': e.detail.value }
        if (e.detail.value) {
            data['form.adImage'] = null
            data['form.showVideo'] = false
        }
        that.setData(data)
    },

    showPhoneModal: function() {
        let that = this
        that.setData({ phoneModal: true })
    },
    hidePhoneModal: function() {
        let that = this
        that.setData({ phoneModal: false })
    },

    setPhoneThenSave: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        if (e.detail && e.detail.iv && e.detail.encryptedData) {
            getApp().request({
                url: '/userapp/session/bindPhone',
                method: 'POST',
                data: {
                    userData: e.detail
                },
                success: function(res) {
                    if (res.statusCode == 200) {
                        let phone = res.data
                        getApp().session.u.phone = phone
                        that.setData({ 'session.u.phone': phone, 'user.phone': phone })
                        that.data.loading = false
                        wx.hideLoading()
                        that.save(e)
                    } else {
                        that.data.loading = false
                        wx.hideLoading()
                        that.setData({
                            getPhoneFailed: true
                        })
                    }
                },
                fail: function() {
                    that.data.loading = false
                    wx.hideLoading()
                    that.setData({
                        getPhoneFailed: true
                    })
                },
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
            that.setData({
                getPhoneFailed: true
            })
        }
    },
    save: function(e) {
        let that = this
        let force = e.currentTarget.dataset.force
        // if (!force && !that.data.user.phone) {
        //     that.showPhoneModal()
        //     return
        // }
        if (!that.data.connectedWifi) {
            wx.showToast({
                title: '请连入一个Wifi后再配置',
                icon: 'none'
            })
            return
        }
        if (!that.data.form.name) {
            wx.showToast({
                title: '请输入店铺名称',
                icon: 'none'
            })
            return
        }
        if (!that.data.form.address) {
            wx.showToast({
                title: '请录入店铺地址',
                icon: 'none'
            })
            return
        }
        if (that.data.loading) return
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        that.data.form.wifi = that.data.connectedWifi
        if (that.data.form.password) that.data.form.wifi.password = that.data.form.password
        delete that.data.form.password
        getApp().request({
            url: '/userapp/wifi/qrcode/save',
            data: {
                qrcodeId: that.data.qrcodeId,
                form: that.data.form
            },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                getApp().toast = '绑定完成'
                wx.reLaunch({
                    url: '/pages/wifi/qrcode?qrcodeId=' + that.data.qrcodeId
                })
            },
        })
    },

    authThenSave: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
        console.log(e)
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        if (e.detail.userInfo) {
            getApp().request({
                url: '/userapp/session/auth',
                data: {
                    userData: e.detail,
                    systemInfo: getApp().systemInfo
                },
                method: 'POST',
                success: function(res) {
                    wx.hideLoading()
                    that.data.loading = false
                    getApp().session = res.data.session
                    that.setData({ session: res.data.session, user: res.data.user })
                    that.save(e)
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },

    openLocation: function() {
        let that = this
        wx.chooseLocation({
            success: function(res) {
                let location = [res.longitude, res.latitude]
                let address = that.data.form.address || res.address
                that.setData({
                    'form.address': address,
                    'form.location': location
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

    connect: function(e) {
        let that = this
        if (that.data.connecting) {
            return
        }
        if (that.data.qrcode && that.data.qrcode.forceVideo && !that.data.watched) {
            if (!that.data.videoAd) {
                that.data.videoAd = wx.createRewardedVideoAd({
                    adUnitId: 'adunit-da23225348eccdb3'
                })
                that.data.videoAd.onError(function(err) {
                    console.log(err.errMsg)
                })
                that.data.videoAd.onClose(function(status) {
                    if (status && status.isEnded || status === undefined) {
                        that.data.watched = true
                        that.connect()
                        if (interstitialAd) {
                            interstitialAd.show().catch((err) => {
                                console.error(err)
                            })
                        }
                    } else {

                    }
                }, )
            }
            that.data.videoAd.load()
                .then(() => that.data.videoAd.show())
                .catch(err => console.log(err.errMsg))
            return
        }
        let data = {
            connecting: true
        }
        if (!that.data.showAd) {
            data.showAd = true
        }
        that.setData(data)
        let param = {
            SSID: that.data.qrcode.wifi.SSID,
            BSSID: that.data.qrcode.wifi.BSSID,
            success: function(res) {
                console.log(res)
                setTimeout(() => {
                    that.setData({
                        connecting: false
                    })
                    that.connected()
                }, 5000);
            },
            fail: function(res) {
                console.log(res)
                wx.hideLoading()
                that.setData({
                    connecting: false
                })
                let error = ''
                let showPassword = false
                if (res.errCode == 12010) {
                    if (res.errMsg == 'connectWifi:fail invalid WPA/WPA2 Passphrase.') {
                        error = 'WiFi密码错误'
                    } else {
                        error = '微信连WiFi时遇到异常，请使用密码连接'
                        showPassword = true
                    }
                } else if (res.errCode == 12001) {
                    error = '抱歉，您的设备不支持一键连接，请使用密码方式'
                    showPassword = true
                } else if (res.errCode == 12002) {
                    error = '密码错误'
                } else if (res.errCode == 12003) {
                    error = '连接超时，请重新尝试'
                } else if (res.errCode == 12005) {
                    error = '未打开WiFi开关'
                } else if (res.errCode == 12007) {
                    return
                } else {
                    showPassword = true
                    error = '您的设备不支持一键连接，请使用密码方式连接'
                }
                getApp().report({
                    title: '用户连接WiFi失败',
                    errorCode: res.errCode,
                    errMsg: res.errMsg
                })
                wx.showToast({
                    title: error,
                    icon: 'none'
                })
                if (!that.data.qrcode.showPassword) {
                    showPassword = false
                }
                that.setData({
                    error: error,
                    showPassword: showPassword
                })
            }
        }
        if (that.data.qrcode.wifi.password) {
            param.password = that.data.qrcode.wifi.password
        } else {
            param.password = ''
        }
        wx.connectWifi(param)
    },

    connected: function() {
        let that = this
        if (that.data.connected) { return }
        let data = {
            connected: true
        }
        if (!that.data.showAd) {
            data.showAd = true
        }
        that.setData(data)
        getApp().request({
            url: '/userapp/wifi/event/connected',
            data: {
                qrcodeId: that.data.qrcodeId
            },
            method: 'POST',
        })

        if (that.data.qrcode.wifi) {
            if (that.data.qrcode.channelMode) {
                setTimeout(() => {
                    that.setData({ channelModal: true })
                }, 2000);
            } else if (that.data.qrcode.showVideo && !that.data.qrcode.forceVideo) {
                setTimeout(() => {
                    let videoAd = wx.createRewardedVideoAd({
                        adUnitId: 'adunit-da23225348eccdb3'
                    })
                    videoAd.load()
                        .then(() => videoAd.show())
                        .catch(err => console.log(err.errMsg))
                    videoAd.onError(function(err) {
                        console.log(err.errMsg)
                    })
                    videoAd.onClose(function(status) {
                        if (status && status.isEnded || status === undefined) {
                            wx.showToast({
                                title: '积分+10',
                                icon: 'none'
                            })
                            if (interstitialAd) {
                                interstitialAd.show().catch((err) => {
                                    console.error(err)
                                })
                            }
                        } else {

                        }
                    }, )
                }, 1000);
            } else {
                that.setData({ cd: 5 })
                that.runClock()
            }
        }
    },
    runClock: function() {
        let that = this
        that.setData({ cd: that.data.cd - 1 })
        if (that.data.cd > 0) {
            setTimeout(() => {
                that.runClock()
            }, 1000);
        } else {
            if (!that.data.indexBreak) {
                getApp().toast = 'WiFi连接成功'
                if (that.data.qrcode.adImage) {
                    getApp().adImage = that.data.qrcode.adImage
                }
                wx.switchTab({ url: '/pages/main/index' })
            }
        }
    },


    toPreview: function() {
        let that = this
        wx.previewImage({
            current: that.data.qrcode.adImage,
            urls: [that.data.qrcode.adImage]
        })
    },

    authThenConnect: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        if (e.detail.userInfo) {
            getApp().request({
                url: '/userapp/session/auth',
                data: {
                    userData: e.detail,
                    systemInfo: getApp().systemInfo,
                },
                method: 'POST',
                success: function(res) {
                    wx.hideLoading()
                    that.data.loading = false
                    getApp().session = res.data.session
                    that.setData({
                        session: res.data.session
                    })
                    that.connect()
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },

    setPhoneThenConnect: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
        that.data.loading = true
        if (e.detail && e.detail.iv && e.detail.encryptedData) {
            getApp().request({
                url: '/userapp/session/bindPhone',
                method: 'POST',
                data: {
                    userData: e.detail
                },
                success: function(res) {
                    if (res.statusCode == 200) {
                        let phone = res.data
                        getApp().session.u.phone = phone
                        that.setData({ 'session.u.phone': phone, 'user.phone': phone })
                        that.data.loading = false
                        that.connect()
                    } else {
                        that.data.loading = false
                        wx.hideLoading()
                        that.setData({
                            getPhoneFailed: true
                        })
                    }
                },
                fail: function() {
                    that.data.loading = false
                    wx.hideLoading()
                    that.setData({
                        getPhoneFailed: true
                    })
                },
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
            that.setData({
                getPhoneFailed: true
            })
        }
    },

    wxserviceLoad: function(e) {
        let that = this
        console.log(e)
    },
    wxserviceError: function(e) {
        let that = this
        console.log(e)
    },
    wxserviceClicked: function() {
        let that = this
    },
    showPasswordModal: function() {
        let that = this
        that.setData({ passwordModal: true })
    },
    hidePasswordModal: function() {
        let that = this
        that.setData({ passwordModal: false })
    },

    toSetting: function() {
        let that = this
        that.data.indexBreak = true
        wx.navigateTo({
            url: '/pages/wifi/detail?qrcodeId=' + that.data.qrcodeId
        })
    },
    switchAdvancedSetting: function() {
        let that = this
        that.setData({ showAdvancedSetting: !that.data.showAdvancedSetting })
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
                        that.setData({ 'form.adImage': that.data.uploadedImage.url })
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
            itemList: ['重新选择', '删除'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    that.uploadAdImage()
                } else if (r.tapIndex == 1) {
                    that.setData({ 'form.adImage': null })
                }
            }
        })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        let that = this
        if (that.data.hide) {
            that.data.hide = false
            that.data.clicked = true
            // that.setData({
            //     advancedWxservice: false
            // })
        }
        if (getApp().toast) {
            wx.showToast({
                title: getApp().toast,
                icon: 'none'
            })
            getApp().toast = null
        }
        if (getApp().systemError) {
            getApp().systemError = null
            this.doLoad()
            return
        }
    },

    toBuy: function() {
        let that = this
        wx.reLaunch({
            url: '/pages/main/index'
        })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {
        if (!this.data.clicked) {
            this.data.hide = true
        }
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        if (getApp().systemError) {
            getApp().systemError = null
            this.doLoad()
            return
        }
        if (!this.data.loading && this.data.session) {
            this.loadData(function() {
                wx.stopPullDownRefresh()
            })
        } else {
            wx.stopPullDownRefresh()
        }
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    },
    copyPassword: function() {
        let that = this
        if (that.data.qrcode.wifi) {
            wx.setClipboardData({
                data: that.data.qrcode.wifi.password,
                success(res) {
                    wx.showToast({
                        title: '密码已复制',
                        icon: 'none'
                    })
                }
            })
        }
    },

    toBindChannel: function() {
        let that = this
        if (that.data.loading) return
        that.data.loading = true
        getApp().request({
            url: '/userapp/wifi/channel/bind',
            data: { qrcodeId: that.data.qrcodeId },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.showToast({
                    title: '操作成功',
                    icon: 'none'
                })
                that.setData({ 'qrcode.channel': res.data.qrcode.channel })
            },
        })
    },

})