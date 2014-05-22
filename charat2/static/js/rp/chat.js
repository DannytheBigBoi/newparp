/* FINAL VARIABLES */

var SEARCH_PERIOD = 1;
var PING_PERIOD = 10;

var USER_ACTION_URL = '/chat_api/user_action';
var SET_GROUP_URL = '/chat_api/set_group';
var SET_TOPIC_URL = '/chat_api/set_topic';
var SET_FLAG_URL = '/chat_api/set_flag';

var SAVE_URL = '/chat_api/save';

var CHAT_PING = '/chat_api/ping';
var CHAT_MESSAGES = '/chat_api/messages';
var CHAT_QUIT = '/chat_api/quit';

var CHAT_FLAGS = ['autosilence','publicity','nsfw'];
var CHAT_FLAG_MAP = {
    'autosilence':true,
    'publicity':'listed',
    'nsfw':true
};

var MOD_GROUPS = ['admin', 'creator', 'mod', 'mod2', 'mod3'];
var GROUP_RANKS = { 'admin': 6, 'mod': 5, 'mod2': 4, 'mod3': 3, 'user': 2, 'silent': 1 };
var GROUP_DESCRIPTIONS = {
    'admin': { title: 'Adoraglobal Mod', description: 'Charat Staff' },
    'creator': { title: 'Chat Creator', description: 'Silence, Kick, Ban, Cannot be demodded' },
    'mod': { title: 'Magical Mod', description: 'Silence, Kick and Ban' },
    'mod2': { title: 'Cute-Cute Mod', description: 'Silence and Kick' },
    'mod3': { title: 'Little Mod', description: 'Silence' },
    'user': { title: 'User', description: '' },
    'silent': { title: 'Silenced', description: '' },
};

var ORIGINAL_TITLE = "Charat RP";
var CHAT_NAME = chat['title'] || chat.url;
var CONVERSATION_CONTAINER = '#conversation';
var CONVERSATION_ID = '#convo';
var MISSED_MESSAGE_COUNT_ID = '#exclaim';
var USER_LIST_ID = '#users';

/* VARIABLES */

var window_active;

var missed_messages = 0;

var chat_topic = chat.topic;

var chat_state = 'chat';
var user_state = 'online';

var current_sidebar = null;

var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
}

var ooc_on = false; // USER META ADD
var preview_show = false; // USER META ADD
var confirm_disconnect = user.meta.confirm_disconnect;
var desktop_notifications = user.meta.desktop_notifications;
var show_bbcode = user.meta.show_bbcode;
var show_bbcode_color = true; // USER META ADD
var show_description = user.meta.show_description;
// Show and Hide different message types
var show_system_messages = user.meta.show_system_messages;
var show_all_info = true; // USER META ADD

var current_user_array = [];
var user_list = {};

var type_force = '';
var sending_line = '';

/* FUNCTIONS */

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function (str){
    return this.slice(-str.length) == str;
  };
}

function getTimestamp(seconds_from_epoch) {
    var month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var timestamp = new Date(seconds_from_epoch*1000);
    return month_names[timestamp.getMonth()]+' '+timestamp.getDate()+' '+(timestamp.getHours()==0?'0':'')+timestamp.getHours()+':'+(timestamp.getMinutes()<10?'0':'')+timestamp.getMinutes();
}

function topbarSelect(selector) {
    $(selector).css({
        'color' : '#C0F0C0',
    });
}

function topbarDeselect(selector) {
    $(selector).css({
        'color' : ''
    });
}

function isChecked(id) {
    var checked = $("input[@id=" + id + "]:checked").length;
    if (checked == 0) {
        return false;
    } else {
        return true;
    }
}

function startChat() {
    $(CONVERSATION_CONTAINER).scrollTop($(CONVERSATION_CONTAINER).prop("scrollHeight"));
    if (!$(document.body).hasClass('mobile')) {
        $("#textInput").focus();
    }
    var crom = $(CONVERSATION_CONTAINER).scrollTop()+$(CONVERSATION_CONTAINER).height()+24;
    var den = $(CONVERSATION_CONTAINER).prop("scrollHeight");
    $(window).resize(function(e) {
        var lon = den-crom;
        if (lon <= 50){
            $(CONVERSATION_CONTAINER).scrollTop($(CONVERSATION_CONTAINER).prop("scrollHeight"));
        }
    });
    msgcont = 0;
    $(CONVERSATION_CONTAINER).removeClass('search');
    $('input, select, button').removeAttr('disabled');
    $('#preview').css('color', '#'+user.character.color);
    
    if ($(document.body).hasClass('mobile')) {
        var current_sidebar = null;
    } else {
        var current_sidebar = "userList";
    }
    if (!current_sidebar) {
        setSidebar(null);
    } else {
        setSidebar(current_sidebar);
    }
    //getMeta();
    getMessages();
    pingInterval = window.setTimeout(pingServer, PING_PERIOD*1000);
    goBottom(CONVERSATION_CONTAINER);
    updateChatPreview();
}

function atBottom(element) {
    var von = $(element).scrollTop()+$(element).height()+24;
    var don = $(element).prop("scrollHeight");
    var lon = don-von;
    if (lon <= 30){
        return true;
    } else {
      return false;
    }
}

function goBottom(element) {
    $(element).scrollTop($(element).prop("scrollHeight"));
}

function addLine(msg){
    if (msg) {
        var at_bottom = atBottom(CONVERSATION_CONTAINER);
        if (!at_bottom) {
            $(MISSED_MESSAGE_COUNT_ID).html(parseInt($(MISSED_MESSAGE_COUNT_ID).html())+1);
        }
    
        if (show_bbcode_color == true) {
            message = bbEncode(msg.text);
        } else {
            message = bbEncode(bbRemove(msg.text));
        }
    
        var alias = "";
        if (msg.acronym) {
            alias = msg.acronym+": ";
        }
    
        if ($(CONVERSATION_CONTAINER+' p:last').hasClass("user"+msg.user_id) && $(CONVERSATION_CONTAINER+' p:last').hasClass('ic') && msg.type == 'ic') {
            $(CONVERSATION_CONTAINER+' p:last').hide();
        }
    
        var left_text = msg.type;
        if (msg.name) {
            if (msg.type == 'ic') {
                left_text = msg.name;
            } else {
                left_text = msg.name+':'+msg.type;
            }
        }
    
        var right_text = '<span class="username">'+msg.user.username+'</span> <span class="post_timestamp">'+getTimestamp(msg.posted)+'<span>';
        
        var message_container = $('<span>').prop("id","message"+msg.id).addClass(msg.type).addClass("user"+msg.user.id).appendTo(CONVERSATION_ID);
        var info = $('<p>').addClass("info").appendTo("#message"+msg.id);
        var info_left = $('<span>').addClass("left").html(left_text).appendTo("#message"+msg.id+" .info");
        var info_right = $('<span>').addClass("right").html(right_text).appendTo("#message"+msg.id+" .info");
        if (msg.type == 'me') {
            var message = $('<p>').addClass("message").html("<span style=\"color: #"+msg.color+";\">"+msg.name+"</span>"+" "+"[<span style=\"color: #"+msg.color+";\">"+msg.acronym+"</span>]"+" "+message).appendTo("#message"+msg.id);
        } else {
            var message = $('<p>').addClass("message").css('color', '#'+msg.color).html(alias+message).appendTo("#message"+msg.id);
        }
        
        if (at_bottom) {
            goBottom(CONVERSATION_CONTAINER);
            at_bottom = false;
        }
        
        if (window_active == false) {
            missed_messages++;
            if (missed_messages !=0) {
                document.title = missed_messages+"! "+chat.title;
            }
        }
        
        if (window_active == false && desktop_notifications == true) {
            show(chat.url,htmlEncode(bbRemove(msg.text)));
        }
        shownotif = 0;
    }
}

function generateUserList(user_data) {
    for (var i=0; i<user_data.length; i++) {
        var list_user = user_data[i];
        var is_self = "";
        var user_description = GROUP_DESCRIPTIONS[list_user.meta.group].title+(GROUP_DESCRIPTIONS[list_user.meta.group].description ? ' – '+GROUP_DESCRIPTIONS[list_user.meta.group].description : '')
        if (list_user.meta.user_id == user.meta.user_id) {
            is_self = " self";
            $(USER_LIST_ID).prop('class', list_user.meta.group);
            $("#userList").prop('class', "sidebar "+list_user.meta.group);
        }
        
        if ($('#user'+list_user.meta.user_id).length <= 0) {
            $(USER_LIST_ID).append('<li id="user'+list_user.meta.user_id+'" class="'+list_user.meta.username+' '+list_user.meta.group+is_self+'"><span class="userCharacter'+'"  style="color:#'+list_user.character.color+';" title="'+user_description+'">'+list_user.character.name+'</span><span class="username">'+list_user.meta.username+'</span></li>');
    
            var user_buttons = '<span class="set">' +
                    '<li class="mod">Make Magical Mod</li>' +
                    '<li class="mod2">Make Cute-Cute Mod</li>' +
                    '<li class="mod3">Make Little Mod</li>' +
                    '<li class="silent">Silence</li>' +
                    '<li class="unsilent">Unsilence</li>' +
                    '<li class="user">Remove Mod Status</li>' +
                '</span>' +
                '<span class="user_action">' +
                    '<li class="kick">Kick</li>' +
                    '<li class="ban">Ban</li>' +
                '</span>' +
                '<span class="chat_action">' +
                    '<li class="block">Block</li>' +
                    '<li class="highlight">Highlight</li>' +
                    '<li class="pm"><a href="/pm/'+list_user.meta.username+'" target="_blank">Private Message</a></li>' +
                '</span>';
    
            $('#user'+list_user.meta.user_id).append('<ul class="user_buttons"></ul>');
            $('#user'+list_user.meta.user_id+' .user_buttons').append(user_buttons);
            user_list[list_user.meta.user_id] = list_user;
            user_list[list_user.meta.username] = list_user;
            
            $('.user_buttons').hide();
            $('#user'+list_user.meta.user_id).on('click', function() {
                var buttons_shown = $(this).find('.user_buttons').is(':visible');
                $('.user_buttons').hide();
                if (buttons_shown) {
                    $(this).find('.user_buttons').hide();
                } else {
                    $(this).find('.user_buttons').show();
                }
            });
        } else {
            $('#user'+list_user.meta.user_id).prop('class',list_user.meta.username+' '+list_user.meta.group+is_self);
            $('#user'+list_user.meta.user_id+' .userCharacter').css('color','#'+list_user.character.color).prop('title', user_description).text(list_user.character.name);
        }
    }

    $(USER_LIST_ID+" .username").each(function() {
        var in_list = false;
        for (var i=0; i<user_data.length; i++) {
            if ($(this).text() == user_data[i].meta.username) {
                in_list = true;
            }
        }
        if (in_list) {
            $(this).parent().show();
        } else {
            $(this).parent().hide();
        }
    });
}

function userAction(user,action,reason) {
    var actionData = {'chat_id': chat.id, 'action': action, 'username': user, 'reason': reason};
    $.post(USER_ACTION_URL,actionData);
}

function setGroup(user,group) {
    var actionData = {'chat_id': chat.id, 'group': group, 'username': user};
    $.post(SET_GROUP_URL,actionData);
}

function setTopic(topic) {
    var actionData = {'chat_id': chat.id, 'topic': topic};
    $.post(SET_TOPIC_URL,actionData);
}

function setFlag(flag,val) {
    var actionData = {'chat_id': chat.id, 'flag': flag, 'value': val};
    $.post(SET_FLAG_URL,actionData);
}

function getMessages() {
    var messageData = {'chat_id': chat['id'], 'after': latestNum};
    $.post(CHAT_MESSAGES, messageData, function(data) {
        messageParse(data);
    }, "json").complete(function() {
        if (chat_state=='chat') {
            window.setTimeout(getMessages, 50);
        } else {
            // Disconnected methods
        }
    });
}

function pingServer() {
    $.post(CHAT_PING, {'chat_id': chat['id']});
    pingInterval = window.setTimeout(pingServer, PING_PERIOD*1000);
    updateChatPreview();
}

function messageParse(data) {
    // KICK/BAN RECEIVAL
    if (typeof data.exit!='undefined') {
        if (data.exit=='kick') {
            clearChat();
            addLine({ counter: -1, color: '000000', text: 'You have been kicked from this chat. Please think long and hard about your behaviour before rejoining.' });
        } else if (data.exit=='ban') {
			clearChat();
            window.location.replace('/chat/theoubliette');
        }
        return true;
    }
    var messages = data.messages;
    for (var i=0; i<messages.length; i++) {
        addLine(messages[i]);
        latestNum = Math.max(latestNum, messages[i]['id']);
    }
    if (typeof data.counter!="undefined") {
        user.meta.counter = data.counter;
    }
    if (typeof data.users!=="undefined") {
        generateUserList(data.users);
    }
    if (typeof data.chat!='undefined') {
        // Reload chat metadata.
        var chat = data.chat;
        
        for (i=0; i<CHAT_FLAGS.length; i++) {
            if (data.chat[CHAT_FLAGS[i]] == CHAT_FLAG_MAP[CHAT_FLAGS[i]]) {
                $('#'+CHAT_FLAGS[i]).prop('checked', 'checked');
                $('#'+CHAT_FLAGS[i]+'Result').show();
            } else {
                $('#'+CHAT_FLAGS[i]).removeAttr('checked');
                $('#'+CHAT_FLAGS[i]+'Result').hide();
            }
        }
        
        if (typeof data.chat.topic!='undefined') {
            $('#topic').html(bbEncode(data.chat.topic));
            chat_topic = data.chat.topic;
        } else {
            $('#topic').text('');
            chat_topic = '';
        }
        
        console.log(chat);

        if (user.meta.group == 'mod' || user.meta.group == 'admin') {
            $('.inPass').hide();
            $('.editPass').show();
        } else {
            $('.editPass').hide();
            $('.inPass').show();
        }
        //NSFW
        if (data.chat['nsfw'] == '1') {
            //Change
        } else {
            //Changed
        }
    }
    if (messages.length>0 && typeof hidden!="undefined" && document[hidden]==true) {

    }
    if (user.meta.group == 'mod' || user.meta.group == 'admin') {
        $('.inPass').hide();
        $('.editPass').show();
        $('.opmod input').removeAttr('disabled');
    } else {
        $('.editPass').hide();
        $('.inPass').show();
        $('.opmod input').prop('disabled', 'disabled');
    }
}

function disconnect() {
    if (confirm('Are you sure you want to disconnect?')) {
        $.ajax(CHAT_QUIT, {'type': 'POST', data: {'chat_id': chat['id']}});
        clearChat();
    }
}

function clearChat() {
    chat_state = 'inactive';
    if (pingInterval) {
        window.clearTimeout(pingInterval);
    }
    $('input[name="chat"]').val(chat.url);
    $('input, select, button').prop('disabled', 'disabled');
    setSidebar(null);
    document.title = (chat.title || chat.url)+' – '+ORIGINAL_TITLE;
    msgcont = 0;
}

function setSidebar(sidebar) {
    $('.sidebar').hide();
    topbarDeselect('#topbar .right span');
    current_sidebar = sidebar;
    if (current_sidebar) {
        $('#'+current_sidebar).show();
        topbarSelect('#topbar .right .'+current_sidebar);
        $(document.body).addClass('withSidebar');
    } else {
        $(document.body).removeClass('withSidebar');
    }

    // if the sidebar changed, check bottom and go to bottom if at bottom
}

function closeSettings() {
    //findit
    if ($(document.body).hasClass('mobile')) {
        if (navigator.userAgent.indexOf('Nintendo 3DS')!=-1 || navigator.userAgent.indexOf('Nintendo DSi')!=-1) {} {
            setSidebar(null);
        }
    } else {
        setSidebar('userList');
    }
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substr(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substr(nameEQ.length,c.length);
    }
    return null;
}

function updateChatPreview() {
    $('#aliasOffset').css('top', (5-$('#textInput').scrollTop())+'px');
    var at_bottom = atBottom(CONVERSATION_CONTAINER);
    var textPreview = $('#textInput').val().replace(/\r\n|\r|\n/g,"[br]");
    $('#textInput').css('opacity','1');
    $('#aliasOffset').css('opacity','1');
    $('#preview').css('opacity','1');
    $('#preview').css('color', '#'+user.character.color);
    $('#textInput').css('color', '#'+user.character.color);
    $('#aliasOffset').css('color', '#'+user.character.color);
    $('#aliasOffset').text(user.character.acronym+":").css('color','#'+user.character.color);
    $("#textInput").css('text-indent', $('#aliasOffset').width()+4+'px');
    
    var command = $('#textInput').val().split(' ');
    
    if (command[0] == '/ic' || command[0] == '/ooc' ||
            command[0] == '/ban' || command[0] == '/kick' ||
            command[0] == '/set' || command[0] == '/topic' ||
            command[0] == '/publicity' || command[0] == '/nsfw' ||
            command[0] == '/autosilence' || command[0] == '/me') {
        textPreview = textPreview.substring(command[0].length);
    }
    
    if ($('#textInput').val().substr(0,2)=='/ ') {
        textPreview = textPreview.substr(2);
    } else if (command[0] != '/me' || command[0] != '/ooc' || !ooc_on || type_force != 'me') {
        textPreview = applyQuirks(textPreview);
    }
    
    var aliasPreview = user.character.acronym ? user.character.acronym+": " : "[blank]: ";
    
    if (!type_force && command[0] != '/me' && command[0] != '/ic' && (command[0] == '/ooc' || ooc_on ||
            textPreview.startsWith("((") || textPreview.endsWith("))") || 
            textPreview.startsWith("[[") || textPreview.endsWith("]]") || 
            textPreview.startsWith("{{") || textPreview.endsWith("}}"))) {
        $('#textInput').css('opacity','0.5');
        $('#aliasOffset').css('opacity','0.5');
        $('#preview').css('opacity','0.5');
    }
    
    if (command[0] == '/me' || type_force == 'me' || 
            command[0] == '/ban' || command[0] == '/kick' ||
            command[0] == '/set' || command[0] == '/topic' ||
            command[0] == '/publicity' || command[0] == '/nsfw' ||
            command[0] == '/autosilence') {
        $('#preview').css('color', '#000000');
        $('#textInput').css('color','#000000');
        $('#aliasOffset').css('color','#000000');
        aliasPreview = "[color=#"+user.character.color+"]"+user.character.name+"[/color] [[color=#"+user.character.color+"]"+user.character.acronym+"[/color]] ";
        $('#aliasOffset').html("<span style='color: #"+user.character.color+";'>"+user.character.name+"</span> [<span style='color: #"+user.character.color+";'>"+user.character.acronym+"</span>]").css('color','#000000');
        $("#textInput").css('text-indent', ($('#aliasOffset').width()+4)+'px');
    }
    
    if (command[0] == '/ban') {
        try {
            var action_user = user_list[command[1]];
            command.splice(0,2);
            var reason = command.join(" ");
            textPreview = "banned [color=#"+action_user.character.color+"]"+action_user.character.name+"[/color] [[color=#"+action_user.character.color+"]"+action_user.character.acronym+"[/color]] from the chat."+(reason ? " Reason: "+reason : "");
        } catch(e) {
            aliasPreview = "";
            textPreview = "[color=#EE0000]Error[/color]";
        }
    } else if (command[0] == '/kick') {
        try {
            var action_user = user_list[command[1]];
            textPreview = "kicked [color=#"+action_user.character.color+"]"+action_user.character.name+"[/color] [[color=#"+action_user.character.color+"]"+action_user.character.acronym+"[/color]] from the chat.";
        } catch(e) {
            aliasPreview = "";
            textPreview = "[color=#EE0000]Error[/color]";
        }
    } else if (command[0] == '/set') {
        var groups = ['magical','cute','little','unsilence','silence'];
        var group_map = {'magical':'mod', 'cute':'mod2', 'little':'mod3','unsilent':'user','silence':'silent'};
        try {
            if (groups.indexOf(command[2])!=-1 && command[1]) {
                var action_user = user_list[command[1]];
                var group_set = GROUP_DESCRIPTIONS[group_map[command[2]]];
                textPreview = "set [color=#"+action_user.character.color+"]"+action_user.character.name+"[/color] [[color=#"+action_user.character.color+"]"+action_user.character.acronym+"[/color]] to "+group_set.title+"."+(group_set.description ? " They can now "+group_set.description+"." : "");
            } else {
                throw "error";
            }
        } catch(e) {
            aliasPreview = "";
            textPreview = "[color=#EE0000]Error[/color]";
        }
    } else if (command[0] == '/topic') {
        try {
            command.splice(0,1);
            var new_topic = command.join(" ");
            textPreview = "changed the topic to \""+new_topic+"\"";
        } catch(e) {
            aliasPreview = "";
            textPreview = "[color=#EE0000]Error[/color]";
        }
    } else if (command[0] == '/nsfw' || command[0] == '/autosilence') {
        try {
            if (command[1] == 'on' || command[1] == 'off') {
                textPreview = "switched "+command[0].substring(1)+" "+command[1];
            } else {
                throw "error";
            }
        } catch(e) {
            aliasPreview = "";
            textPreview = "[color=#EE0000]Error[/color]";
        }
    } else if (command[0] == '/publicity') {
        try {
            if (command[1] == 'listed') {
                textPreview = "listed the chat. It's now listed on the public rooms page.";
            } else if (command[1] == 'unlisted') {
                textPreview = "unlisted the chat.";
            } else {
                throw "error";
            }
        } catch(e) {
            aliasPreview = "";
            textPreview = "[color=#EE0000]Error[/color]";
        }
    }
    
    textPreview = jQuery.trim(textPreview);
    
    if (textPreview.length>0) {
        $('#preview').html(bbEncode(aliasPreview + textPreview));
        sending_line = textPreview;
    } else {
        $('#preview').html(bbEncode(aliasPreview));
    }
    $(CONVERSATION_CONTAINER).css('bottom',($('.controls').height()+20)+'px');
    if(at_bottom) {
        goBottom(CONVERSATION_CONTAINER);
    }
    return textPreview.length!=0;
}

function previewToggle() {
    if (!preview_show) {
         $('#preview').show();
    } else {
        $('#preview').hide();
    }
    updateChatPreview();
    preview_show = !preview_show;
}

// CHANGE THE SETTINGS IN THE CHAT.HTML with {% %}
// CHANGE THE SETTINGS WITH AJAX REQUEST ON BUTTON CLICKS
// BBCODE REWRITE + REMEMBER TO GO THROUGH ALL PREVIOUS MESSAGES AND BBCODE THEM
// CHECK IF COOKIES ARE ENABLED

// REWRITE USERLIST AND ADD IN NEW HIGHLIGHTING AND BLOCKING SCRIPTS

// ADD NEW MESSAGE HIDING

// CUSTOM ALERTS, NO MORE alert();

// REWRITE DESKTOP NOTIFY

$(document).ready(function() {
    if (document.cookie=="") {
        // NOTIFY USER THAT THEY CAN'T CHAT WITHOUT COOKIES
    } else {

        /* START UP */
        startChat();

        $('#control-buttons .ooc-button, #oocToggle input').click(function() {
            if (ooc_on) {
                if (type_force == 'me') {
                    type_force = '';
                    $('#control-buttons .me-button').css('background-color','');
                    $('#oocToggle input').prop('checked','checked');
                    $('#control-buttons .ooc-button').css('background-color','#70a070');
                } else {
                ooc_on = false;
                    $('#oocToggle input').removeProp('checked');
                    $('#control-buttons .ooc-button').css('background-color','');
                }
            } else {
                if (type_force == 'me') {
                    type_force = '';
                    $('#control-buttons .me-button').css('background-color','');
                }
                ooc_on = true;
                $('#oocToggle input').prop('checked','checked');
                $('#control-buttons .ooc-button').css('background-color','#70A070');
            }
            updateChatPreview();
        });

        $('#control-buttons .me-button').click(function() {
            if (type_force == "me") {
                type_force = '';
                $('#control-buttons .me-button').css('background-color','');
                if (ooc_on) {
                    $('#control-buttons .ooc-button').css('background-color','#70A070');
                } else {
                    $('#control-buttons .ooc-button').css('background-color','');
                }
            } else {
                type_force = 'me';
                $('#control-buttons .me-button').css('background-color','#70A070');
                $('#control-buttons .ooc-button').css('background-color','');
            }
            updateChatPreview();
        });

        $('#topbar .right span').click(function() {
            if ($(this).prop('class') == current_sidebar) {
                current_sidebar = null;
                setSidebar(current_sidebar);
            } else {
                current_sidebar = $(this).prop('class');
                setSidebar(current_sidebar);
            }
        });
        
        $('#topic').html(bbEncode($('#topic').text()));
        $('#convo span').each(function() {
            line = bbEncode($(this).find('.message').text());
            $(this).find('.message').html(line);
            $(this).find('.info .right .post_timestamp').text(getTimestamp($(this).find('.info .right .post_timestamp').text()));
        });

        /* SUBMISSION AND ACTIVE CHANGES */

        // Hide info if setting is false
        if (!show_all_info) {
            $(document.body).addClass('hideInfo');
            goBottom(CONVERSATION_CONTAINER);
        }
        
        $('.controls').submit(function() {
            $('#textInput').focus();
            if (jQuery.trim($('#textInput').val())=='/ooc') {
                if (!ooc_on) {
                    $('.ooc-button').click();
                }
                $('#textInput').val('');
                return false;
            } else if (jQuery.trim($('#textInput').val())=='/ic') {
                if (ooc_on) {
                    $('.ooc-button').click();
                }
                $('#textInput').val('');
                return false;
            }
            if (updateChatPreview()) {                
                if ($('#textInput').val().charAt(0)=='/') {
                    var command = $('#textInput').val().split(' ');
                    if (command[0] == '/ban') {
                        userAction(command[1],'ban',command[2]);
                        $('#textInput').val('');
                    }
                    
                    if (command[0] == '/kick') {
                        userAction(command[1],'kick','');
                        $('#textInput').val('');
                    }
                    
                    if (command[0] == '/set') {
                        var groups = ['magical','cute','little','unsilence','silence'];
                        var group_map = {'magical':'mod', 'cute':'mod2', 'little':'mod3','unsilent':'user','silence':'silent'};
                        if (groups.indexOf(command[2].toLowerCase())!=-1) {
                            setGroup(command[1],group_map[command[2]].toLowerCase());
                        }
                        $('#textInput').val('');
                    }
                    
                    if (command[0] == '/topic') {
                        var com = command;
                        com.splice(0,1);
                        var topic_set = com.join(' ');
                        setTopic(topic_set);
                        $('#textInput').val('');
                    }
                    
                    if (command[0] == '/publicity' || command[0] == '/nsfw' || command[0] == '/autosilence') {
                        setFlag(command[0].substr(1),command[1]);
                        $('#textInput').val('');
                    }
                    
                    if (command[0] == '/ooc') {
                        command.splice(0,1);
                        $('#preview').text(command.join(' '));
                        type_force = 'ooc';
                    }
                    
                    if (command[0] == '/ic') {
                        command.splice(0,1);
                        $('#preview').text(command.join(' '));
                        type_force = 'ic';
                    }
                    
                    if (command[0] == '/me') {
                        command.splice(0,1);
                        $('#preview').text(command.join(' '));
                        type_force = 'me';
                    }
                }
                
                if ($('#textInput').val()!='') {
                    if (pingInterval) {
                        window.clearTimeout(pingInterval);
                    }
                    var lineSend = sending_line;
                    var type = ooc_on ? "ooc" : "ic";
                    if (lineSend.startsWith("((") || lineSend.endsWith("))") || lineSend.startsWith("[[") || lineSend.endsWith("]]") || lineSend.startsWith("{{") || lineSend.endsWith("}}")) {
                        type = "ooc";
                    }
                    if (type_force) {
                        type = type_force;
                    }
                    type_force = '';
                    $('#control-buttons .me-button').css('background-color','');
                    $.post('/chat_api/send',{'chat_id': chat['id'], 'text': lineSend, 'type':type}); // todo: check for for error
                    pingInterval = window.setTimeout(pingServer, PING_PERIOD*1000);
                    $('#textInput').val('');
                    updateChatPreview();
                }
            }
            if ($(document.body).hasClass('mobile')) {} else {
                $("#textInput").focus();
            }
            $('#textInput').val('');
            return false;
        });
        
        $('#topicButton').on('click', function() {
            $('#textInput').val('/topic '+chat_topic);
            updateChatPreview();
            if ($('body.mobile').length>0) {
                $('#topbar .userList').click();
            }
        });

        $('#textInput').change(updateChatPreview).keyup(updateChatPreview).change();

        $("textarea#textInput").on('keydown', function(e) {
            if (e.keyCode == 13 && !e.shiftKey)
            {
                e.preventDefault();
                $('.controls').submit();
            }
        });

        $("#statusInput").on('keydown', function(e) {
            if (e.keyCode == 13) {
                $('#statusButton').click();
            }
        });

        // MAKE PREVIEW A SETTING, DEFAULT OFF
        $('#previewToggle input').click(function() {
            preview_show != preview_show;
            previewToggle();
        });

        $('#disconnectButton').click(disconnect);

        $('#statusButton').click(function() {
            new_state = $('#statusInput').val();
            $('#statusInput').val('');
            $.post(POST_URL, {'chat_id': chat['id'], 'state': new_state}, function(data) {
                user_state = new_state;
            });
        });

        $('#settings').submit(function() {
            // Trim everything first
            formInputs = $('#settings').find('input, select');
            for (i=0; i<formInputs.length; i++) {
                formInputs[i].value = jQuery.trim(formInputs[i].value)
            }
            if ($('input[name="name"]').val()=="") {
                alert("You can't chat with a blank name!");
            } else if ($('input[name="color"]').val().match(/^[0-9a-fA-F]{6}$/)==null) {
                alert("You entered an invalid hex code. Try using the color picker.");
            } else {
                var formData = $(this).serializeArray();
                formData.push({ name: 'chat_id', value: chat['id'] })
                $.post(SAVE_URL, formData, function(data) {
                    $('#preview').css('color', '#'+$('input[name="color"]').val());
                    var formInputs = $('#settings').find('input, select');
                    for (i=0; i<formInputs.length; i++) {
                        if (formInputs[i].name!="quirk_from" && formInputs[i].name!="quirk_to") {
                            user.character[formInputs[i].name] = formInputs[i].value;
                        }
                    }
                    user.character.replacements = [];
                    var replacementsFrom = $('#settings').find('input[name="quirk_from"]');
                    var replacementsTo = $('#settings').find('input[name="quirk_to"]');
                    for (i=0; i<replacementsFrom.length; i++) {
                        if (replacementsFrom[i].value!="" && replacementsFrom[i].value!=replacementsTo[i].value) {
                            user.character.replacements.push([replacementsFrom[i].value, replacementsTo[i].value])
                        }
                    }
                    closeSettings();
                });
            }
            return false;
        });
        
        $('#metaOptions input').click(function() {
            var data = {'chat_id': chat['id'], 'meta_change': ''}
            // Convert to integer then string.
            data[this.id] = +this.checked+'';
            $.post(POST_URL, data);
        });
        
        // NEW TOPIC CHANGE FUNCTION

        $('.hidedesc').click(function() {
            if (topicHidden) {
                topichide = 0;
                $('#topic').show();
            } else {
                topichide = 1;
                $('#topic').hide();
            }
            topicHidden = !topicHidden;
            return false;
        });
        
        /* User Action Settings */
        $(document).on('click', '.user_buttons .set li', function() {
            var set_group = $(this).attr('class');
            if (set_group == 'unsilent') {
                set_group = 'user';
            }
            setGroup($(this).parent().parent().parent().attr('class'),set_group);
        });
        
        $(document).on('click', '.user_buttons .user_action li', function() {
            if ($(this).attr('class') != 'ban') {
                userAction($(this).parent().parent().parent().attr('class'),$(this).attr('class'));
            } else {
                $('#textInput').val('/ban '+$(this).parent().parent().parent().attr('class')+' <reason>');
            }
        });

        $(CONVERSATION_CONTAINER).scroll(function(){
            var von = $(CONVERSATION_CONTAINER).scrollTop()+$(CONVERSATION_CONTAINER).height()+24;
            var don = $(CONVERSATION_CONTAINER).prop("scrollHeight");
            var lon = don-von;
            if (lon <= 30){
                $(MISSED_MESSAGE_COUNT_ID).html(0);
            }
        });
        
        $('#textInput').scroll(function() {
            $('#aliasOffset').css('top', (5-$('#textInput').scrollTop())+'px');
        });

        $('#extain').click(function(){
            $(MISSED_MESSAGE_COUNT_ID).html(0);
            $(CONVERSATION_CONTAINER).scrollTop($(CONVERSATION_CONTAINER).prop("scrollHeight"));
        });
        
        $(window).blur(function(e) {
            window_active = false;
        });

        $(window).focus(function(e) {
            if (navigator.userAgent.indexOf('Chrome')!=-1) {
                // You can't change document.title here in Chrome. #googlehatesyou
                window.setTimeout(function() {
                    document.title = chat.title+' – '+ORIGINAL_TITLE;
                    missed_messages = 0;
                }, 200);
            } else {
                document.title = chat.title+' – '+ORIGINAL_TITLE;
                missed_messages = 0;
            }
            window_active = true