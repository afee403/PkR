//app.js
import Dialog from '@vant/weapp/dialog/dialog';
import Notify from '@vant/weapp/notify/notify';
import { hostUrl, appInfo } from './config';
App({
  onLaunch: function () {
    let that = this;
    //初始化tabbar状态
    //that.updateNotices({read: 0, type: undefined});
  },
  globalData: {
    status: {
      tabbar: [
        {
          dot: false,
          number: 0
        },
        {
          dot: false,
          number: 0
        },
        {
          dot: false,
          number: 0
        },
        {
          dot: false,
          number: 0
        }
      ]
    }
  },
  /*******************************
   * 公共方法区
   *******************************/
  /**
   * 设置tabbar状态
   * index: 第几个tab，0~3
   * value: { dot:boolean, number:number }
   */
  /*
  setTabbar: function(index, value){
    if(value.number==0 || value.number==null || value.number==undefined){//取消数字，设置红点
      wx.removeTabBarBadge({
        index: index,
      })
      if(value.dot){
        wx.showTabBarRedDot({
          index: index,
        })
      }else{
        wx.hideTabBarRedDot({
          index: index,
        })
      }
    }else{  //设置数字
      wx.setTabBarBadge({
        index: index,
        text: value.number+'',
      })
    }
  },
*/

  /**
   * 获取基础配置
   */
  config: {
    //获取请求环境
    getHostUrl: function(){
      return hostUrl;
    }
  },

  /**
   * 微信获取用户openid
   */
  getOpenid: function(){
    let that = this;
    return new Promise(
      (resolve, reject) => {
        const openid = wx.getStorageSync('openid');
        if (openid && openid.length > 10) {
          resolve(openid); // 本地有openid缓存，直接返回
        }
        const isMyHost = !/nunet\.cn/.test(hostUrl);
        if (!isMyHost) {
          if (!appInfo.appid || !appInfo.secret) {
            throw new Error('请在 config.js 中配置自己的appid和secret');
          }
        }
        const api = !isMyHost
          ? `/api/main/getOpenid?appid=${appInfo.appid}&secret=${appInfo.secret}`
          : '/api/main/getOpenid';
        wx.login({
          success (res) {
            if (res.code) {
              wx.request({
                url: that.config.getHostUrl()+api,
                method: 'post',
                data: {
                  code: res.code
                },
                success: function(res){
                  if(res.statusCode == 200 && res.data.isSuccess){
                    resolve(res.data.data.openid);
                    wx.setStorageSync('openid', res.data.data.openid); // 缓存openid
                  }else{
                    // 服务器故障  标识：500
                    reject({error: 500, errMsg: "服务器故障", data: res});
                  }
                },
                fail: function(res){
                  // 请求错误
                  reject({error: 400, errMsg:"请求错误", data: res});
                }
              })
            } else {
              // 登录失败
              reject({error: 400, errMsg:res.errMsg, data: res});
            }
          }
        })
      }
    );
  },
  /**
   * 微信授权注册
   */
  getUserInfo: function(){
    let that = this;
    //前提需要通过open-type="getUserInfo"按钮进行用户信息授权
    wx.getSetting({
      complete: (res) => {
        if(res.authSetting['scope.userInfo']){ //如果授权过了，获取用户信息
          wx.getUserInfo({
            complete: (res) => {
              that.getOpenid().then(  //获取openid，不需要授权
                (data) => {
                  let userData = {
                    openid: data,   //openid
                    nickname: res.userInfo.nickName,  //昵称
                    sex: res.userInfo.gender,  //头像
                    img: res.userInfo.avatarUrl  //性别
                  };
                  //跑鸭注册
                  wx.request({
                    url: that.config.getHostUrl()+'/api/main/wxAuth',
                    method: 'post',
                    data: userData,
                    success: (res) => {
                      if(res.data.isSuccess){
                        //注册成功处理逻辑
                        console.log(res.data)
                        //用户信息本地缓存
                        wx.setStorageSync('user', JSON.stringify(res.data.data));
                      }else{
                        // 注册失败
                        console.log(res.data.msg)
                      }
                    },
                    fail: (res) => {
                      // 请求失败
                    }
                  })
                }
              ).catch(
                (data) => {
                  // 错误处理 data: {error, errMsg, data}
                  console.log(data)
                }
              )
            },
          })
        }else{
            //用户未授权，提示框用户授权
        }
      },
    })
  },

  /** 
   * 获取当前用户数据、判断是否注册
  */
  getUser: function(){
    let that = this;
    let user = wx.getStorageSync('user');
    if(user){
      if(user.constructor != Object) user = JSON.parse(user);
      return user;
    }else{
      // 判断是否注册
      that.getOpenid().then(
        (openid)=>{
            wx.request({
                url: that.config.getHostUrl()+'/api/user/getUser',
                method: 'post',
                data: {
                    openid: openid
                },
                success: (res)=>{
                    if(res.data.data != null){ //已注册，未登录
                      wx.showModal({
                        title: '提示',
                        content: '当前操作需要登录才能进行，请登录',
                        success (r) {
                          if (r.confirm) {
                            wx.showToast({
                              title: '登录成功',
                              icon: 'success',
                            })
                            wx.setStorageSync('user', JSON.stringify(res.data.data));
                            user = res.data.data;
                          } else if (r.cancel) {
                            //点击取消，啥也不干
                            wx.showToast({
                              title: '取消登录',
                              icon: 'error',
                            })
                          }
                        }
                      })
                    }else{ //未注册
                      wx.showModal({
                        title: '提示',
                        content: '您还未授权注册，是否立即授权注册？',
                        success (res) {
                          if (res.confirm) {
                            that.getUserInfo();
                          } else if (res.cancel) {
                            //点击取消，啥也不干
                            wx.showToast({
                              title: '取消注册',
                              icon: 'error',
                            })
                          }
                        }
                      })
                    }
                }
            })
        }
      ).catch(
          (err)=>{
              console.log(err);
              wx.showToast({
                title: err,
                icon: 'none',
              })
          }
      )
      return user;
    }
  },

  /**  
   * 作用：检测用户是否注册，阻止未注册用户进行某些事件交互
   * 需要：在页面加 <van-dialog id="van-dialog" />
   * 不传user时: 会先获得openid，然后在线判断是否注册
   */
  checkUser: function(user){
    let that = this;
    if(!user){
      that.showNoticToTraveler();
      return false;
    }else{
      that.getOpenid().then(res => {
        let openid = res;
        wx.request({
          url: that.config.getHostUrl() + '/api/user/getUser',
          method: 'post',
          data: {
            openid: openid
          },
          success: function (res) {
            if (res.statusCode == 200) {
              if (res.data.isSuccess) {
                wx.setStorageSync('user', JSON.stringify(res.data.data));
              } else {
                // 未注册情况
                that.showNoticToTraveler();
              }
            } else {
              // 服务器故障
            }
          },
          fail: function (res) {
            // 请求错误
          }
        })
      })
    }
  },

  // 未注册提示
  showNoticToTraveler: function(){
    wx.showModal({
      title: '提示',
      content: '您还未注册，为了保障你的良好体验，请在个人中心点击授权注册',
      showCancel: false,
    })
  },

  /**  
   * 结束下拉刷新：当使用了下拉刷新，请求结束时调用
  */
  stopRefresh: function(){
    //停止刷新
    wx.stopPullDownRefresh();
    // 隐藏顶部刷新图标
    wx.hideNavigationBarLoading();
  }


  /**  
   * 获取通知
   * type: 1点赞，2评论，0系统通知
   * read: 0未读，1已读
   * getNotices: function(rid, read, type){
   *   if(!rid) return false;
   *   let data = { rid };
   *   if(type==0 || type) data.type = type;
   *   if(read==0 || read) data.read = read;
   *   return new Promise((resolve, reject)=>{
   *     wx.request({
   *       url: this.config.getHostUrl()+'/api/main/getNotice',
   *       data: data,
   *       method: 'POST',
   *       success: (result)=>{
   *         if(result.data.isSuccess){
   *           resolve(result.data.data)
   *         }else{
   *           reject(result.data.msg)
   *         }
   *       },
   *       fail: ()=>{},
   *       complete: ()=>{}
   *     });
   *   })
   * },
   */
  // 更新通知
  /**
   * updateNotices: function({read, type}){
   *   let that = this;
   *   return new Promise((resolved, rejected)=>{
   *     let user = wx.getStorageSync('user');
   *     if(user){
   *       if(user.constructor != Object) user = JSON.parse(user);
   *       let setting = wx.getStorageSync('setting');
   *       if(!setting){
   *         setting = {
   *           power: true,
   *           voice: true,
   *           shake: true,
   *           screen: true,
   *           method: '1'
   *         };
   *         wx.setStorageSync('setting', setting);
   *       }
   *       that.getNotices(user.rid, read, type).then((res)=>{
   *         let moment = 0, system = 0;
   *         let tabbar = that.globalData.status.tabbar;
   *         for(let i=0; i<res.length; i++){
   *             if(res[i].type !=0 && res[i].read==0 ) moment++;
   *             if(res[i].type ==0 && res[i].read==0 ) system++;
   *         }
   *         if(setting.method != '2'){  //非免打扰
   *           if(setting.method == '1'){  //数字提示
   *             tabbar[1] = { dot: false, number: moment}; //动态圈子
   *             tabbar[3] = { dot: false, number: system}; //个人中心
   *           }else if(setting.method == '0'){ //红点
   *             tabbar[1] = { dot: true }; //动态圈子
   *             tabbar[3] = { dot: true }; //动态圈子
   *           }
   *           if(type == 0){
   *             that.setTabbar(3, tabbar[3]);  //设置个人中心tabbar数字
   *           }else {  //全部设置tabbar数字
   *             that.setTabbar(1, tabbar[1]);
   *             that.setTabbar(3, tabbar[3]);
   *           }
   *         }else{ //免打扰
   *           that.setTabbar(1, { dot: false });
   *           that.setTabbar(3, { dot: false });
   *         }
   *         // that.globalData.status.tabbar.forEach(function(item,index){
   *         //   that.setTabbar(index, item)
   *         // })
   *         resolved({moment, system});  //返回数据页面内使用
   *       })
   *     }
   *   })
   * },
   */
  // 阅读消息
  /**
   * doRead(noids) {
   *   if(!noids) return;
   *   if(!(noids instanceof Array)){
   *       noids = [ noids ];
   *   }
   *   return new Promise((resolve, reject)=>{
   *       wx.request({
   *           url: this.config.getHostUrl()+'/api/main/readNotice',
   *           data: { noids },
   *           method: 'POST',
   *           success: (result)=>{
   *               if(result.data.isSuccess){
   *                   resolve(result)
   *               }else{
   *                   reject(result.data.msg)
   *               }
   *           },
   *           fail: ()=>{},
   *           complete: ()=>{}
   *       });
   *   })
   * },
   */
  // 删除消息
  /**
   * doDelete(noids) {
   *   if(!noids) return;
   *   if(!(noids instanceof Array)){
   *       noids = [ noids ];
   *   }
   *   return new Promise((resolve, reject)=>{
   *       wx.request({
   *           url: this.config.getHostUrl()+'/api/main/delNotice',
   *           data: { noids },
   *           method: 'POST',
   *           success: (result)=>{
   *               if(result.data.isSuccess){
   *                   resolve(result)
   *               }else{
   *                   reject(result.data.msg)
   *               }
   *           },
   *           fail: ()=>{},
   *           complete: ()=>{}
   *       });
   *   })
   * },
   */

  /**
   * 查看他人个人中心
   * goToUserPage: function(rid){
   *   wx.navigateTo({
   *     url: '/pages/user/userPage/userPage?rid='+rid
   *   });
   * }
   */

})