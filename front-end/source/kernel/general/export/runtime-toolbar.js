import { xDashConfig } from 'config.js';
import { PAGE_MODE_PAGES, PAGE_MODE_TABS } from 'kernel/general/export/export-constants';

class RuntimeToolbar {
  constructor() {
    this.websiteUrl = xDashConfig.urlWebSite;
    this.iconUrl = `${xDashConfig.urlBaseForExport}assets/chalk-it-icon.svg`;
  }

  // TODO template file with controler
  get toolbarTemplate() {
    return `
      <div class="top-nav">
        <nav class="top-nav__menu" id="nav-menu">
          <ul class="top-nav__nav">
            <li class="top-nav__nav-item">
              <a class="top-nav__brand" target="_blank" href="${this.websiteUrl}" title="Chalk'it website">
                Powered by Chalk'it
                <img src="${this.iconUrl}" alt="Chalk'it Icon"/>
              </a>
            </li>
            <li ng-if="pageMode === '${PAGE_MODE_PAGES}'" class="top-nav__nav-item top-nav__nav-item--row-to-page">
              <button class="top-nav__btn top-nav__btn--rounded" ng-click="changePage(pageNumber-1)">
                <i class="fa fa-chevron-left" aria-hidden="true"></i>
              </button>
              <div class="top-nav__title">Page {{pageNumber+1}} / {{pageNames.length}}</div>
              <button class="top-nav__btn top-nav__btn--rounded" ng-click="changePage(pageNumber+1)">
                <i class="fa fa-chevron-right" aria-hidden="true"></i>
              </button>
            </li>
            <li ng-if="pageMode === '${PAGE_MODE_TABS}'" class="top-nav__nav-item top-nav__nav-item--row-to-tab">
              <div class="top-nav__btn-wrapper" ng-repeat="pageName in pageNames">
                <button id="btn-page-{{$index + 1}}" 
                        class="btn btn-rounded-fill primary" 
                        ng-class="{'cancel': pageNumber !== $index}" 
                        ng-click="changePage($index)">
                  {{pageName}}
                </button>
              </div>
            </li>
          </ul>

          <ul class="top-nav__nav top-nav__nav--right">
            <li class="top-nav__nav-item dropdown" ng-if="navBarNotification">
              <a class="dropdown-toggle info-number" data-toggle="dropdown" aria-expanded="false">
                <i class="fa fa-envelope-o" aria-hidden="true"></i>
                <span class="badge bg-red">{{nbNotifications}}</span>
              </a>
              <ul id="menu1" class="dropdown-menu list-unstyled top-nav__msg-list" role="menu">
                <form>
                  <li class="top-nav__msg-item" ng-if="nbNotifications">
                    <div class="text-center">
                      <div ng-show="!searchFrom" style="display: inline-block; width:80%; margin:13px">
                        <h3 style="margin:0; line-height:normal">Notifications list</h3>
                      </div>
                    </div>
                  </li>
                  <li class="top-nav__msg-item" ng-if="nbNotifications > shownNotificationsMax">
                    <div class="text-center">
                      <strong>..too many notifications! Please acquit a few to display more.</strong>
                    </div>
                  </li>
                  <li class="top-nav__msg-item" 
                      ng-repeat="notification in listNotifications | limitTo: -100 | orderBy: -$index" 
                      ng-show="!notification.hide && (notification.dataNode.indexOf(notificationFilterDataValue) >= 0 || notificationFilterDataValue === '')">
                    <a class="top-nav__msg-link" ng-click="hideNotificationFromNavBar(notification)" title="Click to acquit this notification">
                      <span class="image">
                        <img ng-src="{{urlBase + notification.img}}" alt="Error Message"/>
                      </span>
                      <span>
                        <span>{{notification.title || 'Error'}}</span>
                        <span class="data">Data: {{notification.dataNode}}</span>
                      </span>
                      <span class="message">{{notification.text}}.</span>
                      <span class="time">{{notification.time}}</span>
                    </a>
                  </li>
                  <li class="top-nav__msg-item text-center" ng-if="nbNotifications">
                    <a ng-click="clearAllNotifications()">
                      <strong>Clear All Notifications</strong>
                      <i class="fa fa-angle-right"></i>
                    </a>
                  </li>
                </form>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    `;
  }
}

export const runtimeToolbar = new RuntimeToolbar();
