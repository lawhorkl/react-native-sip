/* eslint-disable camelcase */
import { EventEmitter } from 'events';
import { DeviceEventEmitter, NativeModules } from 'react-native';
import Account, { AccountConstructor } from './Account';
import Call, { CallConstructor } from './Call';
import Message from './Message';

/**
 * SIP headers object, where each key is a header name and value is a header value.
 * Example:
 * {
 *   "X-Custom-Header": "Test Header Value",
 *   "X-Custom-ID": "Awesome Header"
 * }
 *
 * @typedef {Object} PjSipHdrList
 */

/**
 * An additional information to be sent with outgoing SIP message.
 * It can (optionally) be specified for example
 * with #Endpoint.makeCall(), #Endpoint.answerCall(), #Endpoint.hangupCall(),
 * #Endpoint.holdCall() and many more.
 *
 * @typedef {Object} PjSipMsgData
 * @property {String} target_uri - Indicates whether the Courage component is present.
 * @property {PjSipHdrList} hdr_list - Additional message headers as linked list.
 * @property {String} content_type - MIME type of optional message body.
 * @property {String} msg_body - MIME type of optional message body.
 */

/**
 * An additional information to be sent with outgoing SIP message.
 * It can (optionally) be specified for example
 * with #Endpoint.makeCall(), #Endpoint.answerCall(), #Endpoint.hangupCall(),
 * #Endpoint.holdCall() and many more.
 *
 * @typedef {Object} PjSipCallSetttings
 * @property {number} flag - Bitmask of #pjsua_call_flag constants.
 * @property {number} req_keyframe_method - This flag controls what methods to request
 * keyframe are allowed on the call.
 * @property {number} aud_cnt - Number of simultaneous active audio streams for this call.
 * Setting this to zero will disable audio in this call.
 * @property {number} vid_cnt - Number of simultaneous active video streams for this call.
 * Setting this to zero will disable video in this call.
 */

export interface startResult {
  accounts: Array<AccountConstructor>;
  calls: Array<CallConstructor>;
  settings: any;
  connectivity: any;
}

export interface createAccountConfiguration {
  name: string;
  username: string;
  domain: string;
  password: string;
  proxy: string;
  transport: string;
  regServer: string;
  regTimeout: number;
}

export interface PjSipCallSetttings {
  /**
   *
   * Bitmask of #pjsua_call_flag constants.
   * @type {number}
   * @memberof PjSipCallSetttings
   */
  flag: number;

  /**
   *
   * This flag controls what methods to request keyframe are allowed on the call.
   * @type {number}
   * @memberof PjSipCallSetttings
   */
  req_keyfram_method: number;

  /**
   *
   * Number of simultaneous active audio streams for this call. Setting this to zero will disable audio in this call.
   * @type {number}
   * @memberof PjSipCallSetttings
   */
  aud_cnt: number;

  /**
   *
   * Number of simultaneous active video streams for this call. Setting this to zero will disable video in this call.
   * @type {number}
   * @memberof PjSipCallSetttings
   */
  vid_cnt: number;
}
export interface PjSipMsgData {
  /**
   *
   * Indicates whether the Courage component is present.
   * @type {string}
   * @memberof PjSipMsgData
   */
  target_uri: string;

  /**
   *
   * Additional message headers as linked list.
   * @type {*}
   * @memberof PjSipMsgData
   */
  hdr_list: {
    [key: string]: string | number;
  };

  /**
   *
   * MIME type of optional message body.
   * @type {string}
   * @memberof PjSipMsgData
   */
  content_type: string;

  /**
   *
   * MIME type of optional message body.
   * @type {string}
   * @memberof PjSipMsgData
   */
  msg_body: string;
}

export const ORIENTATIONS = [
  'PJMEDIA_ORIENT_UNKNOWN',
  'PJMEDIA_ORIENT_ROTATE_90DEG',
  'PJMEDIA_ORIENT_ROTATE_270DEG',
  'PJMEDIA_ORIENT_ROTATE_180DEG',
  'PJMEDIA_ORIENT_NATURAL',
];

export type OrientationType =
  | 'PJMEDIA_ORIENT_UNKNOWN'
  | 'PJMEDIA_ORIENT_ROTATE_90DEG'
  | 'PJMEDIA_ORIENT_ROTATE_270DEG'
  | 'PJMEDIA_ORIENT_ROTATE_180DEG'
  | 'PJMEDIA_ORIENT_NATURAL';

export default class Endpoint extends EventEmitter {
  constructor() {
    super();

    // Subscribe to Accounts events
    DeviceEventEmitter.addListener(
      'pjSipRegistrationChanged',
      this._onRegistrationChanged.bind(this)
    );

    // Subscribe to Calls events
    DeviceEventEmitter.addListener(
      'pjSipCallReceived',
      this._onCallReceived.bind(this)
    );
    DeviceEventEmitter.addListener(
      'pjSipCallChanged',
      this._onCallChanged.bind(this)
    );
    DeviceEventEmitter.addListener(
      'pjSipCallTerminated',
      this._onCallTerminated.bind(this)
    );
    DeviceEventEmitter.addListener(
      'pjSipCallScreenLocked',
      this._onCallScreenLocked.bind(this)
    );
    DeviceEventEmitter.addListener(
      'pjSipMessageReceived',
      this._onMessageReceived.bind(this)
    );
    DeviceEventEmitter.addListener(
      'pjSipConnectivityChanged',
      this._onConnectivityChanged.bind(this)
    );
    DeviceEventEmitter.addListener(
      'pjSipGSMChanged',
      this._onGSMChanged.bind(this)
    );
  }

  /**
   * Returns a Promise that will be resolved once PjSip module is initialized.
   * Do not call any function while library is not initialized.
   *
   * @returns {Promise}
   */
  start(configuration: any) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.start(
        configuration,
        (successful: boolean, data: startResult) => {
          if (successful) {
            const accounts: Array<Account> = [];
            const calls: Array<Call> = [];

            if (data.hasOwnProperty('accounts')) {
              data.accounts.forEach((d: AccountConstructor) => {
                accounts.push(new Account(d));
              });
            }

            if (data.hasOwnProperty('calls')) {
              data.calls.forEach((d: CallConstructor) => {
                calls.push(new Call(d));
              });
            }

            const extra: any = {};
            Object.entries(data).forEach(([key, value]) => {
              if (
                data.hasOwnProperty(key) &&
                key !== 'accounts' &&
                key !== 'calls'
              ) {
                extra[key] = value;
              }
            });

            resolve({
              accounts,
              calls,
              ...extra,
            });
          } else {
            reject(data);
          }
        }
      );
    });
  }

  stop() {
    return new Promise((resolve) => {
      NativeModules.PjSipModule.stop(() => {
        resolve({});
      });
    });
  }

  updateStunServers(accountId: number, stunServerList: any) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.updateStunServers(
        accountId,
        stunServerList,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * @param configuration
   * @returns {Promise}
   */
  changeNetworkConfiguration(configuration: any) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.changeNetworkConfiguration(
        configuration,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * @param configuration
   * @returns {Promise}
   */
  changeServiceConfiguration(configuration: any) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.changeServiceConfiguration(
        configuration,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Add a new account. If registration is configured for this account, this function would also start the
   * SIP registration session with the SIP registrar server. This SIP registration session will be maintained
   * internally by the library, and application doesn't need to do anything to maintain the registration session.
   *
   * An example configuration:
   * {
   *   name: "John Doe",
   *   username: "100",
   *   domain: "pbx.com",
   *   password: "XXXXXX",
   *
   *   proxy: "192.168.100.1:5060", // default disabled.
   *   transport: "TCP", // default TCP
   *   regServer: "pbx.com", // default taken from domain
   *   regTimeout: 300, // default 300
   * }
   *
   * @param {Object} configuration
   * @returns {Promise}
   */
  createAccount(configuration: createAccountConfiguration) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.createAccount(
        configuration,
        (successful: boolean, data: AccountConstructor) => {
          if (successful) {
            resolve(new Account(data));
          } else {
            reject(data);
          }
        }
      );
    });
  }

  // replaceAccount(account: any, configuration: any) {
  //   throw new Error("Not implemented");
  // }

  /**
   * Update registration or perform unregistration.
   * If registration is configured for this account, then initial SIP REGISTER will be sent when the account is added.
   * Application normally only need to call this function if it wants to manually update the registration or to unregister from the server.
   *
   * @param {Account} account
   * @param bool renew If renew argument is zero, this will start unregistration process.
   * @returns {Promise}
   */
  registerAccount(account: Account, renew = true) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.registerAccount(
        account.getId(),
        renew,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Delete an account. This will unregister the account from the SIP server, if necessary, and terminate server side presence subscriptions associated with this account.
   *
   * @param {Account} account
   * @returns {Promise}
   */
  deleteAccount(account: Account) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.deleteAccount(
        account.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Make an outgoing call to the specified URI.
   * Available call settings:
   * - audioCount - Number of simultaneous active audio streams for this call. Setting this to zero will disable audio in this call.
   * - videoCount - Number of simultaneous active video streams for this call. Setting this to zero will disable video in this call.
   * -
   *
   * @param account {Account}
   * @param destination {String} Destination SIP URI.
   * @param callSettings {PjSipCallSetttings} Outgoing call settings.
   * @param msgSettings {PjSipMsgData} Outgoing call additional information to be sent with outgoing SIP message.
   */
  makeCall(
    account: Account,
    destination: string,
    callSettings: PjSipCallSetttings,
    msgData: PjSipMsgData
  ) {
    const normalizedDestination = this._normalize(account, destination);

    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.makeCall(
        account.getId(),
        normalizedDestination,
        callSettings,
        msgData,
        (successful: boolean, data: CallConstructor) => {
          if (successful) {
            resolve(new Call(data));
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Send message to the specified URI.
   * -
   *
   * @param account {Account}
   * @param destination {String} Destination SIP URI.
   * @param msg {String} Message.
   */
  sendMessage(account: Account, destination: string, msg: string) {
    const normalizedDestination = this._normalize(account, destination);

    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.sendMessage(
        account.getId(),
        normalizedDestination,
        msg,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  imTyping(account: Account, destination: string, isTyping: boolean) {
    const normalizedDestination = this._normalize(account, destination);

    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.imTyping(
        account.getId(),
        normalizedDestination,
        isTyping,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Send response to incoming INVITE request.
   *
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  answerCall(call: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.answerCall(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Hangup call by using method that is appropriate according to the call state.
   *
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  hangupCall(call: Call) {
    // TODO: Add possibility to pass code and reason for hangup.
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.hangupCall(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Hangup call by using Decline (603) method.
   *
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  declineCall(call: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.declineCall(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Put the specified call on hold. This will send re-INVITE with the appropriate SDP to inform remote that the call is being put on hold.
   *
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  holdCall(call: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.holdCall(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Release the specified call from hold. This will send re-INVITE with the appropriate SDP to inform remote that the call is resumed.
   *
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  unholdCall(call: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.unholdCall(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  muteCall(call: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.muteCall(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  unMuteCall(call: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.unMuteCall(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  useSpeaker(call: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.useSpeaker(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * @param call {Call} Call instance
   * @returns {Promise}
   */
  useEarpiece(call: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.useEarpiece(
        call.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Initiate call transfer to the specified address.
   * This function will send REFER request to instruct remote call party to initiate a new INVITE session to the specified destination/target.
   *
   * @param account {Account} Account associated with call.
   * @param call {Call} The call to be transferred.
   * @param destination URI of new target to be contacted. The URI may be in name address or addr-spec format.
   * @returns {Promise}
   */
  xferCall(account: Account, call: Call, destination: string) {
    const normalizedDestination = this._normalize(account, destination);

    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.xferCall(
        call.getId(),
        normalizedDestination,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Initiate attended call transfer.
   * This function will send REFER request to instruct remote call party to initiate new INVITE session to the URL of destCall.
   * The party at destCall then should "replace" the call with us with the new call from the REFER recipient.
   *
   * @param call {Call} The call to be transferred.
   * @param destCall {Call} The call to be transferred.
   * @returns {Promise}
   */
  xferReplacesCall(call: Call, destCall: Call) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.xferReplacesCall(
        call.getId(),
        destCall.getId(),
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Redirect (forward) specified call to destination.
   * This function will send response to INVITE to instruct remote call party to redirect incoming call to the specified destination/target.
   *
   * @param account {Account} Account associated with call.
   * @param call {Call} The call to be transferred.
   * @param destination URI of new target to be contacted. The URI may be in name address or addr-spec format.
   * @returns {Promise}
   */
  redirectCall(account: Account, call: Call, destination: string) {
    const normalizedDestination = this._normalize(account, destination);

    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.redirectCall(
        call.getId(),
        normalizedDestination,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * Send DTMF digits to remote using RFC 2833 payload formats.
   *
   * @param call {Call} Call instance
   * @param digits {String} DTMF string digits to be sent as described on RFC 2833 section 3.10.
   * @returns {Promise}
   */
  dtmfCall(call: Call, digits: string) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.dtmfCall(
        call.getId(),
        digits,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  activateAudioSession() {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.activateAudioSession(
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  deactivateAudioSession() {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.deactivateAudioSession(
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  changeOrientation(orientation: OrientationType) {
    if (ORIENTATIONS.indexOf(orientation) === -1) {
      throw new Error(
        `Invalid ${JSON.stringify(
          orientation
        )} device orientation, but expected ${ORIENTATIONS.join(', ')} values`
      );
    }

    NativeModules.PjSipModule.changeOrientation(orientation);
  }

  changeCodecSettings(codecSettings: any) {
    return new Promise((resolve, reject) => {
      NativeModules.PjSipModule.changeCodecSettings(
        codecSettings,
        (successful: boolean, data: any) => {
          if (successful) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      );
    });
  }

  /**
   * @fires Endpoint#connectivity_changed
   * @private
   * @param data {Object}
   */
  _onConnectivityChanged(data: AccountConstructor) {
    /**
     * Fires when registration status has changed.
     *
     * @event Endpoint#connectivity_changed
     * @property {Account} account
     */
    this.emit('connectivity_changed', new Account(data));
  }

  /**
   * @fires Endpoint#gsm_changed
   * @private
   * @param data {Boolean}
   */
  _onGSMChanged(data: any) {
    /**
     * Fires when registration status has changed.
     *
     * @event Endpoint#gsm_changed
     * @property {Boolean} isUsingGSM
     */
    this.emit('gsm_changed', data);
  }

  /**
   * @fires Endpoint#registration_changed
   * @private
   * @param data {Object}
   */
  _onRegistrationChanged(data: any) {
    /**
     * Fires when registration status has changed.
     *
     * @event Endpoint#registration_changed
     * @property {Account} account
     */
    this.emit('registration_changed', new Account(data));
  }

  /**
   * @fires Endpoint#call_received
   * @private
   * @param data {Object}
   */
  _onCallReceived(data: CallConstructor) {
    /**
     * TODO
     *
     * @event Endpoint#call_received
     * @property {Call} call
     */
    this.emit('call_received', new Call(data));
  }

  /**
   * @fires Endpoint#call_changed
   * @private
   * @param data {Object}
   */
  _onCallChanged(data: CallConstructor) {
    /**
     * TODO
     *
     * @event Endpoint#call_changed
     * @property {Call} call
     */
    this.emit('call_changed', new Call(data));
  }

  /**
   * @fires Endpoint#call_terminated
   * @private
   * @param data {Object}
   */
  _onCallTerminated(data: CallConstructor) {
    /**
     * TODO
     *
     * @event Endpoint#call_terminated
     * @property {Call} call
     */
    this.emit('call_terminated', new Call(data));
  }

  /**
   * @fires Endpoint#call_screen_locked
   * @private
   * @param lock bool
   */
  _onCallScreenLocked(lock: boolean) {
    /**
     * TODO
     *
     * @event Endpoint#call_screen_locked
     * @property bool lock
     */
    this.emit('call_screen_locked', lock);
  }

  /**
   * @fires Endpoint#message_received
   * @private
   * @param data {Object}
   */
  _onMessageReceived(data: any) {
    /**
     * TODO
     *
     * @event Endpoint#message_received
     * @property {Message} message
     */
    this.emit('message_received', new Message(data));
  }

  // /**
  //  * @fires Endpoint#connectivity_changed
  //  * @private
  //  * @param available bool
  //  */
  // _onConnectivityChanged(available) {
  //   /**
  //    * @event Endpoint#connectivity_changed
  //    * @property bool available True if connectivity matches current Network settings, otherwise false.
  //    */
  //   this.emit("connectivity_changed", available);
  // }

  /**
   * Normalize Destination URI
   *
   * @param account
   * @param destination {string}
   * @returns {string}
   * @private
   */
  _normalize(account: Account, destination: string) {
    let normalizedData = null;
    if (!destination.startsWith('sip:')) {
      let realm = account.getRegServer();

      if (!realm) {
        realm = account.getDomain();
        const s = realm.indexOf(':');

        if (s > 0) {
          realm = realm.substr(0, s + 1);
        }
      }

      normalizedData = `sip:${destination}@${realm}`;
    }

    return normalizedData;
  }
  // setUaConfig(UaConfig value)
  // setMaxCalls
  // setUserAgent
  // setNatTypeInSdp

  // setLogConfig(LogConfig value)
  // setLevel
}
