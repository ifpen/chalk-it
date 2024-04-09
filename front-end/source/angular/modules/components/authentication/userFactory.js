angular.module('xCLOUD')
    .service('SessionUser', [function() {

        var userIDVarName = "userId",
            userNameVarName = "userName",
            tokenVarName = "token",
            userAvatarVarName = "userAvatar",
            bLegalConditionsAcceptedVarName = "bLegalConditionsAccepted";

        this.setUserId = function(userId) {
            sessionStorage.setItem(userIDVarName, userId);
        };
        this.setUserAvatar = function(userAvatar) {
            sessionStorage.setItem(userAvatarVarName, userAvatar);
        };
        this.setLegalConditionsAccepted = function(bAccepted) {
            this.setCookie(bLegalConditionsAcceptedVarName, bAccepted, 100);
        };
        this.getUserId = function() {
            return sessionStorage.getItem(userIDVarName);
        };
        this.getUserName = function() {
            return sessionStorage.getItem(userNameVarName);
        };
        this.getToken = function() {
            return sessionStorage.getItem(tokenVarName);
        };
        this.getUserAvatar = function() {
            return sessionStorage.getItem(userAvatarVarName);
        };
        this.getLegalConditionsAccepted = function() {
            return this.getCookie(bLegalConditionsAcceptedVarName);
        };
        this.getUserProfile = function() {
            return {
                userName: this.getUserName(),
                userId: this.getUserId(),
                token: this.getToken(),
                userAvatar: this.getUserAvatar()
            };
        };
        this.setExpiredDate = function() {

        };
        this.checkSession = function() {

        };
        this.setCookie = function(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        };
        this.getCookie = function(cname) {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        };
        return this;
    }]);