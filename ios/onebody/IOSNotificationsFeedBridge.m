#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "IOSNotificationsFeedSerializer.h"

static NSNumber *IOSNotificationsFeedCoerceBoolValue(id value) {
  if (!value) {
    return nil;
  }

  if ([value isKindOfClass:[NSNumber class]]) {
    return @([(NSNumber *)value boolValue]);
  }

  if ([value isKindOfClass:[NSString class]]) {
    NSString *normalizedValue = [(NSString *)value lowercaseString];
    if ([normalizedValue isEqualToString:@"1"] || [normalizedValue isEqualToString:@"true"]) {
      return @YES;
    }

    if ([normalizedValue isEqualToString:@"0"] || [normalizedValue isEqualToString:@"false"]) {
      return @NO;
    }
  }

  return nil;
}

NSDictionary *IOSNotificationsFeedSerializeRemoteMessage(NSDictionary *userInfo) {
  if (![userInfo isKindOfClass:[NSDictionary class]]) {
    return nil;
  }

  NSMutableDictionary *message = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *notification = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *notificationIOS = [[NSMutableDictionary alloc] init];

  for (id key in userInfo) {
    if (![key isKindOfClass:[NSString class]]) {
      continue;
    }

    id value = userInfo[key];
    NSString *stringKey = (NSString *)key;

    if ([stringKey isEqualToString:@"gcm.message_id"] ||
        [stringKey isEqualToString:@"google.message_id"] ||
        [stringKey isEqualToString:@"message_id"]) {
      message[@"messageId"] = value;
      continue;
    }

    if ([stringKey isEqualToString:@"message_type"]) {
      message[@"messageType"] = value;
      continue;
    }

    if ([stringKey isEqualToString:@"collapse_key"]) {
      message[@"collapseKey"] = value;
      continue;
    }

    if ([stringKey isEqualToString:@"from"] ||
        [stringKey isEqualToString:@"google.c.sender.id"]) {
      message[@"from"] = value;
      continue;
    }

    if ([stringKey isEqualToString:@"google.c.a.ts"]) {
      message[@"sentTime"] = value;
      continue;
    }

    if ([stringKey isEqualToString:@"to"] ||
        [stringKey isEqualToString:@"google.to"]) {
      message[@"to"] = value;
      continue;
    }

    if ([stringKey isEqualToString:@"aps"] ||
        [stringKey hasPrefix:@"gcm."] ||
        [stringKey hasPrefix:@"google."]) {
      continue;
    }

    data[stringKey] = value;
  }

  message[@"data"] = data;

  NSDictionary *apsDict = [userInfo[@"aps"] isKindOfClass:[NSDictionary class]] ? userInfo[@"aps"] : nil;
  if (apsDict) {
    if (apsDict[@"category"] != nil) {
      message[@"category"] = apsDict[@"category"];
    }

    if (apsDict[@"thread-id"] != nil) {
      message[@"threadId"] = apsDict[@"thread-id"];
    }

    NSNumber *contentAvailable = IOSNotificationsFeedCoerceBoolValue(apsDict[@"content-available"]);
    if (contentAvailable != nil) {
      message[@"contentAvailable"] = contentAvailable;
    }

    NSNumber *mutableContent = IOSNotificationsFeedCoerceBoolValue(apsDict[@"mutable-content"]);
    if ([mutableContent boolValue]) {
      message[@"mutableContent"] = mutableContent;
    }

    if (apsDict[@"badge"] != nil) {
      notificationIOS[@"badge"] = apsDict[@"badge"];
    }

    id alert = apsDict[@"alert"];
    if ([alert isKindOfClass:[NSString class]]) {
      notification[@"title"] = alert;
    } else if ([alert isKindOfClass:[NSDictionary class]]) {
      NSDictionary *apsAlertDict = (NSDictionary *)alert;

      if (apsAlertDict[@"title"] != nil) {
        notification[@"title"] = apsAlertDict[@"title"];
      }

      if (apsAlertDict[@"title-loc-key"] != nil) {
        notification[@"titleLocKey"] = apsAlertDict[@"title-loc-key"];
      }

      if (apsAlertDict[@"title-loc-args"] != nil) {
        notification[@"titleLocArgs"] = apsAlertDict[@"title-loc-args"];
      }

      if (apsAlertDict[@"body"] != nil) {
        notification[@"body"] = apsAlertDict[@"body"];
      }

      if (apsAlertDict[@"loc-key"] != nil) {
        notification[@"bodyLocKey"] = apsAlertDict[@"loc-key"];
      }

      if (apsAlertDict[@"loc-args"] != nil) {
        notification[@"bodyLocArgs"] = apsAlertDict[@"loc-args"];
      }

      if (apsAlertDict[@"subtitle"] != nil) {
        notificationIOS[@"subtitle"] = apsAlertDict[@"subtitle"];
      }

      if (apsAlertDict[@"subtitle-loc-key"] != nil) {
        notificationIOS[@"subtitleLocKey"] = apsAlertDict[@"subtitle-loc-key"];
      }

      if (apsAlertDict[@"subtitle-loc-args"] != nil) {
        notificationIOS[@"subtitleLocArgs"] = apsAlertDict[@"subtitle-loc-args"];
      }
    }

    id sound = apsDict[@"sound"];
    if ([sound isKindOfClass:[NSString class]]) {
      notification[@"sound"] = sound;
    } else if ([sound isKindOfClass:[NSDictionary class]]) {
      NSDictionary *apsSoundDict = (NSDictionary *)sound;
      NSMutableDictionary *notificationIOSSound = [[NSMutableDictionary alloc] init];

      if (apsSoundDict[@"name"] != nil) {
        notificationIOSSound[@"name"] = apsSoundDict[@"name"];
      }

      NSNumber *critical = IOSNotificationsFeedCoerceBoolValue(apsSoundDict[@"critical"]);
      if (critical != nil) {
        notificationIOSSound[@"critical"] = critical;
      }

      if (apsSoundDict[@"volume"] != nil) {
        notificationIOSSound[@"volume"] = apsSoundDict[@"volume"];
      }

      if (notificationIOSSound.count > 0) {
        notificationIOS[@"sound"] = notificationIOSSound;
      }
    }
  }

  if (notificationIOS.count > 0) {
    notification[@"ios"] = notificationIOS;
  }

  if (notification.count > 0) {
    message[@"notification"] = notification;
  }

  NSString *messageId = message[@"messageId"];
  if (![messageId isKindOfClass:[NSString class]]) {
    return nil;
  }

  NSString *trimmedMessageId =
      [messageId stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  if (trimmedMessageId.length < 1) {
    return nil;
  }

  return message;
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
