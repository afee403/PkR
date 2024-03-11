// pages/user/user.js
const app = getApp();
import Notify from '@vant/weapp/notify/notify';
import Dialog from '@vant/weapp/dialog/dialog';
import Toast from '@vant/weapp/toast/toast';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: {
      img: "/imgs/default/girl.jpg"
    },  //用户数据
    unreadMessagesNum: 0, //未读信息
    isUnsigned: true,  //未注册
    medals: [],
    isShowSettingMenu: false, //设置菜单
    isShowProtocol: false,    //用户协议
    cacheSize: '0kB',         //缓存
    isShowloading: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //初始化页面数据
    this.initData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // app.checkUser()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    app.updateNotices({read: 0, type: 0}).then(({system})=>{
        this.setData({
            unreadMessagesNum: system
        })
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.initData();
  },

  initData: function() {
    // 初始化用户数据
    // let user = that.getUserInfoFromLocal();
    //初始化：获取用户数据
    this.getUserData();
    //初始化：缓存数据
    this.setCacheSize();
  },

  /**
   * 跳转
   */
  //跳转到用户编辑页面
  goToEdit: function(){
    let that = this;
    let user = that.data.user;
    wx.navigateTo({
      url: 'edit/edit',
      events: {
        // 获取被打开页面传送到当前页面的数据
        whenUpdated: function(data) {
          // console.log('修改成功返回的数据',data)
          that.setData({ user: data })
          wx.setStorageSync('user', data);
        },
      },
      success: (res)=>{
        res.eventChannel.emit('getDataFromUserPage', user)
      },
      fail: ()=>{},
      complete: ()=>{}
    });
  },

  //从服务器获取：判断是否注册、本地缓存
  getUserData: function(){
    let that = this;
    that.setData({
        isShowloading: true
    });
    app.getOpenid().then(res => {
      let openid = res;
      wx.request({
        url: app.config.getHostUrl() + '/api/user/getUser',
        method: 'post',
        data: {
          openid: openid
        },
        success: function (res) {
          if (res.statusCode == 200) {
            if (res.data.isSuccess) {
              that.updateCurrentUser(res.data.data);
              that.setData({isUnsigned: false});
              wx.setStorageSync('user', JSON.stringify(res.data.data));
              // 获取勋章称号
              that.getUserAll(res.data.data.rid);
              // Notify({ type: 'success', message: "刷新成功" });
            } else {
              // 未注册情况
              that.setData({isUnsigned: true})
              Notify({ type: 'danger', message: "您还未注册" });
            }
          } else {
            // 服务器故障
          }
        },
        fail: function (res) {
          // 请求错误
        },
        complete: function (){
          that.setData({
              isShowloading: false
          });
          app.stopRefresh();  //停止刷新状态的显示
        }
      })
    })
  },

  /**
   * 注册并获取用户信息
   */
  getUserInfo: function(e){
    let that = this;
    app.getOpenid().then(  //获取openid，不需要授权
      (data) => {
        let userData = {
          openid: data,   //openid
          nickname: e.detail.userInfo.nickName,  //昵称
          sex: e.detail.userInfo.gender,  //性别
          img: e.detail.userInfo.avatarUrl  //头像
        };
        //注册
        wx.request({
          url: app.config.getHostUrl()+'/api/main/wxAuth',
          method: 'post',
          data: userData,
          success: (res) => {
            if(res.data.isSuccess){
              //注册成功处理逻辑
              console.log(res.data)
              // 获取勋章称号
              // that.getUserAll(res.data.data.rid);
              that.setData({
                medals_count: res.data.data.medals.length,
                honors: res.data.data.honors instanceof Array ? res.data.data.honors[0] : res.data.data.honors,
                medals: that.parseMedals(res.data.data.medals),
                isUnsigned: false
              });
              let user = {...res.data.data};
              delete user.honors;
              delete user.medals;
              that.updateCurrentUser(user);
              wx.setStorageSync('user', JSON.stringify(user));
            }else{
              // 注册失败
              console.log(res.data.msg)
            }
          },
          fail: (res) => {
            // 请求失败
          }
        })
    });
  },

  // 从本地获取用户数据
  getUserInfoFromLocal: function () {
    let user = wx.getStorageSync('user');
    if (user) {
      return JSON.parse(user);
    } else return false;
  },

  // 更新用户显示数据
  updateCurrentUser: function (data) {
    if (data) {
      this.setData({ user: data });
    }
  },
/*
  // 获取已获勋章
  getMedals: function(){
    let that = this;
    let user = that.data.user;
    let rid = user.rid
    wx.request({
      url: app.config.getHostUrl()+'/api/user/getMedal',
      method: 'post',
      data: { rid },
      success: (res) => {
        if(res.data.isSuccess){
          user.medals = res.data.data instanceof Array ? res.data.data : [res.data.data];
          that.setData({ user });
        }
      }
    })
  },

  // 获取勋章称号等数据
  getUserAll: function () {
    let that = this;
    let user = that.data.user;
    let rid = user.rid
    wx.request({
      url: app.config.getHostUrl() + '/api/user/getUserAll',
      method: 'post',
      data: {
        rid: rid
      },
      success: function (res) {
        if (res.statusCode == 200) {
          if (res.data.isSuccess) {
            that.setData({
              medals_count: res.data.data.medals.length,
              honors: res.data.data.honors instanceof Array ? res.data.data.honors[0] : res.data.data.honors,
              medals: that.parseMedals(res.data.data.medals),
            });
          }
        } else {
          // 服务器故障
        }
      },
      fail: function (res) {
        // 请求错误
      }
    })
  },

  // 处理勋章数据
  parseMedals: function (medals) {
    if(medals == []) return medals;
    let nmedals = [];
    for (let i = 0; i < medals.length; i++) {
      if (medals[i] == undefined) continue;
      let outer = medals[i];
      let item = [outer]; //内循收集
      for (let n = i + 1; n < medals.length; n++) {
        if (outer.type == 0) break;
        if (medals[n] == undefined) continue;
        let inner = medals[n];
        if (outer.meid == inner.meid) {
          item.push(inner);
          delete medals[n];  //用splice不行，因为n的最大值在循环开始就确定了
        }
      }
      nmedals.push(item);
    }
    return nmedals;
  },
*/

//获取个人勋章数据
requestData(rid) {
  return new Promise((resolve, reject)=>{
      wx.request({
          url: app.config.getHostUrl()+'/api/user/getMedal',
          data: { rid },
          method: 'POST',
          success: (result)=>{
              if(result.data.isSuccess){
                  resolve(result.data.data);
              }else{
                  reject(result.data.msg);
              }
          },
          fail: ()=>{},
          complete: ()=>{}
      });
  })
},

// 处理勋章数据
parseMedals(medals) {
  if(medals == []) return medals;
  let nmedals = [];
  for (let i = 0; i < medals.length; i++) {
      // if (medals[i] == undefined) continue;
      let outer = medals[i];
      let item = [outer]; //内循收集
      // for (let n = i + 1; n < medals.length; n++) {
      //     if (outer.type == 0) break;
      //     if (medals[n] == undefined) continue;
      //     let inner = medals[n];
      //     if (outer.meid == inner.meid) {
      //     item.push(inner);
      //     delete medals[n];  //用splice不行，因为n的最大值在循环开始就确定了
      //     }
      // }
      nmedals.push(item);
  }
  return nmedals;
},


  /** 
   * 设置方法
   */
  // 关闭一些弹窗
  onClose: function(){
    this.setData({
      isShowSettingMenu: false,  // 关闭菜单弹窗
      isShowProtocol: false,     // 关闭用户协议
    })
  },

  // 显示设置菜单
  showSettingMenu: function(){
    this.setData({
      isShowSettingMenu: true
    })
  },

  // 展示用户协议
  showProtocol: function(){
    this.setData({
      isShowProtocol: true
    })
  },

  // 查询并设置缓存数据
  setCacheSize: function(){
    let that = this;
    wx.getStorageInfo({
      success (res) {
        that.setData({
          cacheSize: res.currentSize+"KB"
        })
        // console.log(res.limitSize)
      }
    })
  },

  // 清除缓存
  cleanCache: function(){
    let that = this;
    Dialog.confirm({
      title: '提示',
      zIndex: 200,
      message: '清除缓存数据，只会清除您本地的数据，并不会删除您在我们服务器上的数据',
      confirmButtonText: '取消',
      cancelButtonText: '确认'
    }).then(() => {
      // on confirm
    }).catch(() => {
      // on cancel
      wx.clearStorageSync();
      that.setCacheSize();
    });
  },

  //检查更新
  checkUpdate() {
    Toast.loading({
        mask: false,
        duration: 1500,
        message: '检测中...',
      });
    setTimeout(()=>{
        Toast({
            duration: 2000,
            message: '当前已是最新版本'
        });
    }, 1800);
  },

  // 注销账号
  deleteUser() {
    let that = this;
    Dialog.confirm({
        title: '危险操作',
        zIndex: 200,
        message: '该操作不可撤销，一旦确认，将从本系统中删除您的所有数据，请谨慎操作',
        confirmButtonText: '取消',
        cancelButtonText: '确认'
    })
    .then(() => {

    })
    .catch(()=>{
        Dialog.confirm({
            title: '再次确认',
            zIndex: 200,
            message: '确认要注销您的账户，并清除您所有的数据吗？',
            confirmButtonText: '取消',
            cancelButtonText: '确认'
        })
        .then(() => {
        
        })
        .catch(()=>{
            wx.request({
                url: app.config.getHostUrl()+'/api/user/doUnset',
                data: {
                    rid: that.data.user.rid
                },
                method: 'POST',
                success: (result)=>{
                    
                },
                fail: ()=>{},
                complete: ()=>{}
            });
        })
    })
  }
})