#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "IOSNotificationsFeedSerializer.h"
#import "RNFBMessagingSerializer.h"

NSDictionary *IOSNotificationsFeedSerializeRemoteMessage(NSDictionary *userInfo) {
  if (![userInfo isKindOfClass:[NSDictionary class]]) {
    return nil;
  }

  NSDictionary *payload = [RNFBMessagingSerializer remoteMessageUserInfoToDict:userInfo];
  if (![payload isKindOfClass:[NSDictionary class]]) {
    return nil;
  }

  NSString *messageId = payload[@"messageId"];
  if (![messageId isKindOfClass:[NSString class]]) {
    return nil;
  }

  NSString *trimmedMessageId =
      [messageId stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  if (trimmedMessageId.length < 1) {
    return nil;
  }

  return payload;
}

@interface RCT_EXTERN_MODULE(IOSNotificationsFeedBridge, RCTEventEmitter)

RCT_EXTERN_METHOD(getPendingNotifications:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(addListener:(NSString *)eventName)
RCT_EXTERN_METHOD(removeListeners:(double)count)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
