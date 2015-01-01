var msparp = (function() {

	// Character info
	function update_character(data) {
		if (typeof data["search_character"]!= "undefined") {
			$("select[name=search_character_id]").val(data["search_character"]["id"]);
		}
		$("#toggle_with_settings").prop("checked", true);
		$("input[name=name]").val(data["name"]);
		$("input[name=alias]").val(data["alias"]).keyup();
		$("input[name=color]").val("#"+data["color"]).change();
		if (typeof data["text_preview"]!= "undefined") {
			$("#text_preview").text(data["text_preview"]);
		} else if (typeof data["search_character"]!= "undefined") {
			$("#text_preview").text(data["search_character"]["text_preview"]);
		}
		if (data["quirk_prefix"] != "" || data["quirk_suffix"] != "" || data["case"] != "normal" || data["replacements"].length != 0 || data["regexes"].length != 0) {
			$("#toggle_typing_quirks").prop("checked", true);
		}
		$("input[name=quirk_prefix]").val(data["quirk_prefix"]);
		$("input[name=quirk_suffix]").val(data["quirk_suffix"]);
		$("select[name=case]").val(data["case"]);
		clear_replacements();
		if (data["replacements"].length == 0) {
			add_replacement();
		} else {
			data["replacements"].forEach(function(replacement) { add_replacement(null, replacement[0], replacement[1]); });
		}
		clear_regexes();
		if (data["regexes"].length == 0) {
			add_regex();
		} else {
			data["regexes"].forEach(function(regex) { add_regex(null, regex[0], regex[1]); });
		}
	}

	// Replacement list
	function delete_replacement(e) {
		$(this.parentNode).remove();
		return false;
	}
	function add_replacement(e, from, to) {
		var size = $(document.body).hasClass("chat") ? 7 : 10;
		new_item = $("<li><input type=\"text\" name=\"quirk_from\" size=\"" + size + "\"> to <input type=\"text\" name=\"quirk_to\" size=\"" + size + "\"> <button type=\"button\" class=\"delete_replacement\">x</button></li>");
		if (from && to) {
			var inputs = $(new_item).find('input');
			inputs[0].value = from;
			inputs[1].value = to;
		}
		$(new_item).find('.delete_replacement').click(delete_replacement);
		$(new_item).appendTo('#replacement_list');
		return false;
	}
	function clear_replacements(e) {
		$('#replacement_list').empty();
		return false;
	}

	// Regex list
	function delete_regex(e) {
		$(this.parentNode).remove();
		return false;
	}
	function add_regex(e, from, to) {
		var size = $(document.body).hasClass("chat") ? 7 : 10;
		new_item = $("<li><input type=\"text\" name=\"regex_from\" size=\"" + size + "\"> to <input type=\"text\" name=\"regex_to\" size=\"" + size + "\"> <button type=\"button\" class=\"delete_regex\">x</button></li>");
		if (from && to) {
			var inputs = $(new_item).find('input');
			inputs[0].value = from;
			inputs[1].value = to;
		}
		$(new_item).find('.delete_regex').click(delete_regex);
		$(new_item).appendTo('#regex_list');
		return false;
	}
	function clear_regexes(e) {
		$('#regex_list').empty();
		return false;
	}

	// Event handlers for character form
	function initialize_character_form() {
		// Search character dropdown
		$("select[name=search_character_id]").change(function() {
			$.get("/search_characters/"+this.value+".json", {}, update_character);
		});
		// Text preview
		var text_preview_container = $("#text_preview_container");
		var text_preview_alias = $("#text_preview_alias");
		$("input[name=alias]").keyup(function() {
			if (this.value == "") {
				text_preview_alias.text("");
			} else {
				text_preview_alias.text(this.value + ": ");
			}
		});
		$("input[name=color]").change(function() {
			text_preview_container.css("color", this.value);
		});
		// Replacement list
		$('.delete_replacement').click(delete_replacement);
		$('#add_replacement').click(add_replacement);
		$('#clear_replacements').click(clear_replacements);
		// Regex list
		$('.delete_regex').click(delete_regex);
		$('#add_regex').click(add_regex);
		$('#clear_regexes').click(clear_regexes);
	}

	return {
		// Homepage
		"home": function() {

			// Saved character dropdown
			$("select[name=character_id]").change(function() {
				if (this.value != "") {
					$.get("/characters/"+this.value+".json", {}, update_character);
				}
			});

			initialize_character_form();

			// Picky checkboxes
			$(".character_list legend input").click(function() {
				var group = $(this).parentsUntil(".toggle_box").last();
				group.find("li input").prop("checked", this.checked);
			});
			$(".character_list ul input").click(function() {
				var group = $(this).parentsUntil(".toggle_box").last();
				var group_input = group.find("legend input");
				var characters = group.find("li input");
				var checked_characters = group.find("li input:checked");
				if (checked_characters.length == 0) {
					group_input.prop("checked", false).prop("indeterminate", false);
				} else if (checked_characters.length == characters.length) {
					group_input.prop("checked", true).prop("indeterminate", false);
				} else {
					group_input.prop("checked", false).prop("indeterminate", true);
				}
			});

		},
		// Character search
		"search": function() {

			var searching = false;
			var searcher_id;

			function start_search() {
				if (!searching) {
					searching = true;
					$(document.body).addClass("searching");
					$.post("/search", {}, function(data) {
						searcher_id = data.id;
						continue_search();
					}).error(function() {
						searching = false;
						$(document.body).removeClass("searching").addClass("search_error");
					});
				}
			}

			function continue_search() {
				if (searching) {
					$.post("/search/continue", { "id": searcher_id }, function(data) {
						console.log(data);
						if (data.status == "matched") {
							searching = false;
							window.location.href = "/" + data.url;
						} else if (data.status == "quit") {
							searching = false;
						} else {
							continue_search();
						}
					}).error(function() {
						window.setTimeout(function() {
							searching = false;
							start_search();
						}, 2000);
					});
				}
			}

			function stop_search() {
				searching = false;
				$.ajax("/search/stop", { "type": "POST", data: { "id": searcher_id }, "async": false });
				$(document.body).removeClass("searching");
			}

			$(window).unload(function () {
				if (searching) {
					stop_search();
				}
			});

			start_search();

		},
		// Character pages
		"character": function() {
			initialize_character_form();
		},
		// Chat window
		"chat": function(chat, user, latest_message) {

			console.log(chat);
			console.log(user);
			console.log(latest_message);

			var conversation = $("#conversation");
			var status;
			var user_data = {};

			// Long polling
			function launch_long_poll() {
				$.post("/chat_api/messages", { "chat_id": chat.id, "after": latest_message }, receive_messages).complete(function(jqxhr, text_status) {
					if (status == "chatting") {
						if (jqxhr.status < 400 && text_status == "success") {
							launch_long_poll();
						} else {
							window.setTimeout(launch_long_poll, 2000);
							// XXX display a message if it still doesn't work after several attempts.
						}
					}
				});
			}

			// Ping loop
			function ping() {
				if (status == "chatting") {
					$.post("/chat_api/ping", { "chat_id": chat.id }).complete(function() { window.setTimeout(ping, 10000); });
				}
			}

			// Quitting
			window.onbeforeunload = function(e) {
				if (status == "chatting" && user.meta.confirm_disconnect) {
					if (typeof e != "undefined") { e.preventDefault(); }
					return "";
				}
			}
			$(window).unload(function() {
				if (status == "chatting") {
					status = "disconnected";
					$.ajax("/chat_api/quit", { "type": "POST", data: { "chat_id": chat.id }, "async": false});
				}
			});

			// Parsing and rendering messages
			var show_notification = false;
			function receive_messages(data) {
				if (typeof data.exit != "undefined") {
					exit();
					if (data.exit == "kick") {
						render_message({
							"alias": "",
							"color": "000000",
							"id": null,
							"name": "",
							"posted": Math.floor(Date.now() / 1000),
							"text": "You have been kicked from this chat. Please think long and hard about your behavior before returning.",
							"type": "exit",
							"user_number": null,
						});
						scroll_to_bottom();
					} else if (data.exit == "ban") {
						if (chat.url != "theoubliette") { location.replace("/theoubliette") };
					}
					return;
				}
				if (typeof data.messages != "undefined" && data.messages.length != 0) {
					var scroll_after_render = is_at_bottom();
					show_notification = false;
					data.messages.forEach(render_message);
					if (scroll_after_render) { scroll_to_bottom(); }
					if (show_notification && (document.hidden || document.webkitHidden || document.msHidden)) {
						document.title = "New message - " + original_title;
					}
				}
				if (typeof data.chat != "undefined") {
					chat = data.chat;
					if (chat.type == "group") {
						topic.text(chat.topic);
						description.text(chat.description);
						rules.text(chat.rules);
						flag_autosilence.prop("checked", chat.autosilence);
						flag_publicity.prop("checked", chat.publicity == "listed");
						flag_style.val(chat.style);
						flag_level.val(chat.level);
						chat.autosilence ? flag_message_autosilence.show() : flag_message_autosilence.hide();
						chat.publicity == "listed" ? flag_message_publicity.show() : flag_message_publicity.hide();
						flag_message_style.text(style_messages[chat.style]);
						flag_message_level.text(level_names[chat.level]);
					}
				}
				if (typeof data.users != "undefined") {
					user_list.html(user_list_template(data));
					user_list.find("li").click(render_action_list);
					for (var i = 0; i < data.users.length; i++) {
						// Store user data so we can look it up for action lists.
						user_data[data.users[i].meta.number] = data.users[i];
						// Also update our own user data.
						if (data.users[i].meta.number == user.meta.number) {
							user.meta.group = data.users[i].meta.group;
							text_preview.css("color", "#" + user.character.color);
							text_input.css("color", "#" + user.character.color);
							if (chat.type == "group") {
								if (user.meta.group == "admin" || user.meta.group == "creator" || user.meta.group == "mod" || user.meta.group == "mod2" || user.meta.group == "mod3") {
									mod_tools.show();
									info_panel_controls.show();
									flag_messages.hide();
								} else {
									mod_tools.hide();
									info_panel_controls.hide();
									flag_messages.show();
								}
							}
							if (user.meta.group == "silent") {
								text_input.prop("disabled", true);
								send_button.prop("disabled", true);
							} else {
								text_input.prop("disabled", false);
								send_button.prop("disabled", false);
							}
						}
					}
					// Re-render the action list if necessary.
					if (action_user != null) {
						var action_user_number = action_user.meta.number;
						var action_user_li = user_list.find("#unum_" + action_user_number);
						// Set to null so it fires the open action rather than the close action.
						if (action_user_li.length != 0) {
							action_user = null;
							action_user_li.click();
						}
					}
				}
			}
			function render_message(message) {
				latest_message = message.id;
				// Skip notifications for system messages if we're hiding them.
				if (user.meta.show_connection_messages || ["join", "disconnect", "timeout"].indexOf(message.type) == -1) {
					show_notification = true;
				}
				var p = $("<p>").attr("id", "message_" + message.id);
				p.addClass("message_" + message.type + " unum_" + message.user_number);
				p.css("color", "#" + message.color);
				if (message.type == "me") {
					var text = "* " + message.name + " " + message.text;
				} else if (message.alias != "") {
					var text = message.alias + ": " + message.text;
				} else {
					var text = message.text;
				}
				if (message.user_number) { text = "<" + message.user_number + "> " + text; }
				p.text(text);
				p.appendTo(conversation);
			}

			// "New message" notification
			var original_title = document.title;
			function visibility_handler() {
				window.setTimeout(function() { document.title = original_title; }, 200);
			}
			if (typeof document.hidden !== "undefined") {
				document.addEventListener("visibilitychange", visibility_handler);
			} else if (typeof document.msHidden !== "undefined") {
				document.addEventListener("msvisibilitychange", visibility_handler);
			} else if (typeof document.webkitHidden !== "undefined") {
				document.addEventListener("webkitvisibilitychange", visibility_handler);
			}

			// Names and text
			var style_messages = {
				"script": "Please use script style.",
				"paragraph": "Please use paragraph style.",
				"either": "Script and paragraph style are allowed.",
			};
			var level_names = { "sfw": "SFW", "nsfw": "NSFW", "nsfw-extreme": "NSFW extreme" };
			var group_descriptions = {
				"admin": "God tier moderator - MSPARP staff.",
				"creator": "Chat creator - can silence, kick and ban other users.",
				"mod": "Professional Wet Blanket - can silence, kick and ban other users.",
				"mod2": "Bum's Rusher - can silence and kick other users.",
				"mod3": "Amateur Gavel-Slinger - can silence other users.",
				"user": "",
				"silent": "Silenced.",
			};

			// Actions and validation
			if (chat.type == "group") {
				function can_set_group(new_group, current_group) {
					// Setting group only works in group chats.
					if (chat.type != "group") { return false; }
					// Don't bother if they're already this group.
					if (ranks[new_group] == ranks[current_group]) { return false; }
					// You can't set groups at all if you're not a mod.
					if (ranks[user.meta.group] < 1) { return false; }
					// You can only set the group to one which is below yours.
					if (ranks[new_group] >= ranks[user.meta.group]) { return false; }
					// You can only set the group of people whose group is below yours.
					if (ranks[current_group] >= ranks[user.meta.group]) { return false; }
					return true;
				}
				function can_perform_action(action, their_group) {
					// User actions only work in group chats.
					if (chat.type != "group") { return false; }
					// You can only kick if you're a Bum's Rusher or above.
					if (action == "kick" && ranks[user.meta.group] < 2) { return false; }
					// You can only ban if you're a Bum's Rusher or above.
					if (action == "ban" && ranks[user.meta.group] < 3) { return false; }
					// You can only perform actions on people whose group is below yours.
					if (ranks[their_group] >= ranks[user.meta.group]) { return false; }
					return true;
				}
				function set_group(number, group) { $.post("/chat_api/set_group", { "chat_id": chat.id, "number": number, "group": group }); }
				function user_action(number, action, reason) {
					var data = { "chat_id": chat.id, "number": number, "action": action };
					if (reason) { data["reason"] = reason; }
					$.post("/chat_api/user_action", data);
				}
			}

			// Text commands
			var text_commands = [
				{
					"regex": /^me (.*\S+.*)/,
					"group_chat_only": false,
					"minimum_rank": 0,
					"description": function(match) {
						return "* " + user.character.name + " " + match[1];
					},
					"action": function(match) {
						$.post("/chat_api/send", { "chat_id": chat.id, "type": "me", "text": match[1] });
					},
				},
				{
					"regex": /^topic($|\s.*$)/,
					"group_chat_only": true,
					"minimum_rank": 1,
					"description": function(match) {
						var new_topic = match[1].trim();
						return new_topic ? "Set the topic to \"" + new_topic + "\"" : "Remove the topic.";
					},
					"action": function(match) {
						$.post("/chat_api/set_topic", { "chat_id": chat.id, "topic": match[1].trim() });
					},
				},
				{
					"regex": /^set (\d+) (mod|mod2|mod3|user|silent)$/,
					"group_chat_only": true,
					"minimum_rank": 1,
					"description": function(match) {
						var set_user = user_data[parseInt(match[1])];
						var group_description = group_descriptions[match[2]] || "regular user.";
						if (!set_user || can_set_group(match[2], set_user.meta.group)) {
							return "Set " + name_from_user_number(parseInt(match[1])) + " to " + group_descriptions[match[2]];
						} else if (match[2] == set_user.meta.group) {
							return set_user.character.name + " is already a member of this group.";
						} else {
							return "Your current privileges don't allow you to set " + set_user.character.name + "'s group.";
						}
					},
					"action": function(match) {
						var set_user = user_data[parseInt(match[1])];
						if (!set_user || can_set_group(match[2], set_user.meta.group)) { set_group(match[1], match[2]); }
					},
				},
				{
					"regex": /^kick (\d+)$/,
					"group_chat_only": true,
					"minimum_rank": 2,
					"description": function(match) {
						var set_user = user_data[parseInt(match[1])];
						if (!set_user || can_perform_action("kick", set_user.meta.group)) {
							return "Kick " + name_from_user_number(parseInt(match[1])) + " from the chat.";
						} else {
							return "Your current privileges don't allow you to kick " + set_user.character.name + ".";
						}
					},
					"action": function(match) {
						var set_user = user_data[parseInt(match[1])];
						if (!set_user || can_perform_action("kick", set_user.meta.group)) { user_action(match[1], "kick"); }
					},
				},
				{
					"regex": /^ban (\d+)($|\s.*$)?/,
					"group_chat_only": true,
					"minimum_rank": 3,
					"description": function(match) {
						console.log(match);
						var set_user = user_data[parseInt(match[1])];
						if (!set_user || can_perform_action("ban", set_user.meta.group)) {
							return "Ban " + name_from_user_number(parseInt(match[1])) + " from the chat.";
						} else {
							return "Your current privileges don't allow you to ban " + set_user.character.name + ".";
						}
					},
					"action": function(match) {
						var set_user = user_data[parseInt(match[1])];
						if (!set_user || can_perform_action("ban", set_user.meta.group)) { user_action(match[1], "ban", (match[2] || "").trim()); }
					},
				},
			];
			function name_from_user_number(number) {
				return user_data[number] ? user_data[number].character.name : "user " + number;
			}
			function get_command_description(text) {
				for (var i=0; i < text_commands.length; i++) {
					if (text_commands[i].group_chat_only && chat.type != "group") { continue; }
					if (text_commands[i].minimum_rank > ranks[user.meta.group]) { continue; }
					var match = text.match(text_commands[i].regex);
					if (match && match.length > 0) { return text_commands[i].description(match); }
				}
				return false;
			}
			function execute_command(text) {
				for (var i=0; i < text_commands.length; i++) {
					if (text_commands[i].group_chat_only && chat.type != "group") { continue; }
					if (text_commands[i].minimum_rank > ranks[user.meta.group]) { continue; }
					var match = text.match(text_commands[i].regex);
					if (match && match.length > 0) { text_commands[i].action(match); return true; }
				}
				return false;
			}

			// Topbar and info panel
			if (chat.type == "group") {
				$("#topbar").click(function() {
					edit_info_panel.css("display") == "block" ? edit_info_panel.hide() : info_panel.toggle();
				});
				// There are several places where we show the topic, so we use this to update them all.
				var topic = $(".topic");
				var info_panel = $("#info_panel");
				var description = $("#description");
				var rules = $("#rules");
				var info_panel_controls = $("#info_panel_controls");
				$("#edit_info_button").click(function() {
					info_panel.hide();
					// Only set these when we need them.
					edit_info_panel.find("[name=description]").text(chat.description);
					edit_info_panel.find("[name=rules]").text(chat.rules);
					edit_info_panel.show();
				});
				$(".set_topic_button").click(function() {
					var topic = prompt("Please enter a new topic for the chat:");
					if (topic != null) {
						$.post("/chat_api/set_topic", { "chat_id": chat.id, "topic": topic });
					}
				});
				var edit_info_panel = $("#edit_info_panel");
				$("#edit_info_form").submit(function() {
					var form_data = $(this).serializeArray();
					form_data.push({ name: "chat_id", value: chat.id });
					$.post("/chat_api/set_info", form_data);
					edit_info_panel.hide();
					return false;
				});
			}

			// Sidebars
			$(".close").click(function() { $(this).parentsUntil("body").last().hide(); });

			// Mod tools
			if (chat.type == "group") {
				var mod_tools = $("#mod_tools");
				var flag_autosilence = $("#flag_autosilence").change(function() {
					$.post("/chat_api/set_flag", { "chat_id": chat.id, "flag": "autosilence", "value": this.checked ? "on" : "off" });
				});
				var flag_publicity = $("#flag_publicity").change(function() {
					$.post("/chat_api/set_flag", { "chat_id": chat.id, "flag": "publicity", "value": this.checked ? "listed" : "unlisted" });
				});
				var flag_style = $("#flag_style").change(function() {
					$.post("/chat_api/set_flag", { "chat_id": chat.id, "flag": "style", "value": this.value });
				});
				var flag_level = $("#flag_level").change(function() {
					$.post("/chat_api/set_flag", { "chat_id": chat.id, "flag": "level", "value": this.value });
				});
				var flag_messages = $("#flag_messages");
				var flag_message_autosilence = $("#flag_message_autosilence");
				var flag_message_publicity = $("#flag_message_publicity");
				var flag_message_style = $("#flag_message_style");
				var flag_message_level = $("#flag_message_level");
			}

			// User list
			var user_list = $("#user_list");
			var user_list_template = Handlebars.compile($("#user_list_template").html());
			Handlebars.registerHelper("group_description", function(group) { return group_descriptions[group]; });
			Handlebars.registerHelper("is_you", function() { return this.meta.number == user.meta.number; });

			// Action list
			var action_user = null;
			var action_list = $("#action_list");
			var action_list_template = Handlebars.compile($("#action_list_template").html());
			var ranks = { "admin": Infinity, "creator": Infinity, "mod": 3, "mod2": 2, "mod3": 1, "user": 0, "silent": -1 };
			function render_action_list() {
				var action_user_number = parseInt(this.id.substr(5));
				if (action_user && action_user_number == action_user.meta.number) {
					action_user = null;
					action_list.empty();
				} else {
					action_user = user_data[action_user_number];
					action_list.html(action_list_template(action_user));
					action_list.appendTo(this);
					$("#action_switch_character").click(function() { $("#switch_character").show(); });
					$("#action_settings").click(function() { $("#settings").show(); });
					$("#action_mod, #action_mod2, #action_mod3, #action_user, #action_silent").click(function() {
						set_group(action_user.meta.number, this.id.substr(7));
					});
					$("#action_kick, #action_ban").click(function() {
						if (this.id == "action_ban") { var reason = prompt("Please provide a reason for this ban."); }
						user_action(action_user.meta.number, this.id.substr(7), reason || "");
					});
				}
			}
			Handlebars.registerHelper("can_set_group", function(new_group) { return can_set_group(new_group, this.meta.group); });
			Handlebars.registerHelper("can_perform_action", function(action) { return can_perform_action(action, this.meta.group); });
			Handlebars.registerHelper("set_user_text", function() { return this.meta.group == "silent" ? "Unsilence" : "Unmod"; });

			// Switch character
			var switch_character = $("#switch_character");
			$("select[name=character_id]").change(function() {
				if (this.value != "") {
					$.get("/characters/"+this.value+".json", {}, update_character);
				}
			});
			initialize_character_form();
			$("#switch_character_form").submit(function() {
				if ($("input[name=name]").val().trim() == "") {
					alert("You can't chat with a blank name!");
				} else if ($("input[name=color]").val().match(/^#?[0-9a-fA-F]{6}$/) == null) {
					alert("You entered an invalid hex code.");
				} else {
					var form_data = $(this).serializeArray();
					form_data.push({ name: "chat_id", value: chat.id });
					$.post("/chat_api/save", form_data, function(data) { user = data; });
				}
				switch_character.hide();
				return false;
			});

			// Settings
			var settings = $("#settings");
			$(".variable").click(function() {
				var data = { "chat_id": chat.id };
				data[this.id] = this.checked ? "on" : "off";
				$.post("/chat_api/save_variables", data);
				user.meta[this.id] = this.checked;
				parse_variables();
			});
			function parse_variables() {
				user.meta.show_preview ? text_preview.show() : text_preview.hide();
				user.meta.show_connection_messages ? conversation.removeClass("hide_connection_messages") : conversation.addClass("hide_connection_messages");
				resize_conversation();
			}
			$("#subscribed").click(function() {
				$.post("/" + chat.url + "/" + (this.checked ? "subscribe" : "unsubscribe"));
				user.meta.subscribed = this.checked;
			});

			// Conversation
			function is_at_bottom() {
				var current_scroll = conversation.scrollTop() + conversation.height();
				var max_scroll = conversation[0].scrollHeight;
				return max_scroll - current_scroll < 30;
			}
			function scroll_to_bottom() { conversation.scrollTop(conversation[0].scrollHeight); }
			function resize_conversation() {
				var scroll_after_resize = is_at_bottom();
				conversation.css("bottom", send_form.height() + 10 + "px");
				if (scroll_after_resize) { scroll_to_bottom(); }
			}

			// Send form
			var text_preview = $("#text_preview");
			var text_input = $("input[name=text]").keyup(function() {
				if (user.meta.show_preview) {
					if (this.value[0] == "/") {
						var text = this.value.substr(1);
						text_preview.text(get_command_description(text) || text);
					} else {
						text_preview.text(apply_quirks(this.value));
					}
					resize_conversation();
				}
			});
			var send_form = $("#send_form").submit(function() {
				var text = text_input.val().trim();
				if (text == "") { return false; }
				if (text[0] == "/") {
					var text = text.substr(1);
					// Try to parse the text as a command, and skip the rest if we can.
					var executed = execute_command(text);
					if (executed) { text_input.val(""); return false; }
				} else {
					text = apply_quirks(text).trim();
				}
				// Check if it's blank before and after because quirks may make it blank.
				if (text == "") { return false; }
				$.post("/chat_api/send", { "chat_id": chat.id, "text": text });
				text_input.val("");
				last_alternating_line = !last_alternating_line;
				return false;
			});
			var send_button = send_form.find("button[type=submit]");

			// Typing quirks
			var last_alternating_line = false;
			function apply_quirks(text) {
				// Case options.
				// ["case"] instead of .case because .case breaks some phones and stuff.
				switch (user.character["case"]) {
					case "lower":
						// Adaptive lower
						// Part 1: convert words to lower case if they have at least one lower case letter in them.
						text = text.replace(/\w*[a-z]+\w*/g, function(str) { return str.toLowerCase(); });
						// Part 2: convert lone capital letters (eg. I) to lower case.
						// Find single capital letters with adjacent lower case ones, potentially looping in case they overlap.
						text = text.replace(/(^|[a-z])(\W*[A-Z]\W*([a-z]|$))+/g, function(str) { return str.toLowerCase(); });
						break;
					case "upper":
						text = text.toUpperCase();
						break;
					case "title":
						// Capitalise the first letter at the beginning, and the first character after whitespace.
						text = text.toLowerCase().replace(/(^|\s)[a-z]/g, function(str) { return str.toUpperCase(); });
						break;
					case "inverted":
						// Lower case the first letter at the beginning, the first letter of each sentence, and lone Is.
						text = text.toUpperCase().replace(/^.|[,.?!]\s+\w|\bI\b/g, function(str){ return str.toLowerCase(); });
						break;
					case "alternating":
						// Pick up pairs of letters (optionally with whitespace in between) and capitalise the first in each pair.
						text = text.toLowerCase().replace(/(\w)\W*\w?/g, function(str, p1){ return str.replace(p1, p1.toUpperCase()); });
						break;
					case "alt-lines":
						text = last_alternating_line ? text.toUpperCase() : text.toLowerCase();
						break;
					case "proper":
						// Capitalise the first letter at the beginning, the first letter of each sentence, and lone Is.
						text = text.replace(/^.|[.?!]\s+\w|\bi\b/g, function(str) { return str.toUpperCase() });
						break;
					case "first-letter":
						// Part 1: same as adaptive lower.
						text = text.replace(/\w*[a-z]+\w*/g, function(str) { return str.toLowerCase(); });
						text = text.replace(/(^|[a-z])(\W*[A-Z]\W*([a-z]|$))+/g, function(str) { return str.toLowerCase(); });
						// Part 2: capitalise the first letter at the beginning and the first letter of each sentence.
						text = text.replace(/^.|[.?!]\s+\w/g, function(str) { return str.toUpperCase() });
						break;
				}
				// Ordinary replacements. Escape any regex control characters before replacing.
				user.character.replacements.forEach(function(replacement) {
					RegExp.quote = function(str) {return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"); }
					var re = new RegExp(RegExp.quote(replacement[0]), "g");
					text = text.replace(re, replacement[1]);
				});
				// Regex replacements
				user.character.regexes.forEach(function(replacement) {
					try {
						re = new RegExp(replacement[0], "g");
						text = text.replace(re, replacement[1]);
					} catch (e) {
						text = "Regex parsing error :(";
						return;
					}
				});
				// Prefix and suffix
				return user.character.quirk_prefix + text + user.character.quirk_suffix;
			}

			// Abscond/reconnect button
			var abscond_button = $("#abscond_button").click(function() {
				if (status == "chatting") {
					if (confirm("Are you sure you want to abscond?")) { disconnect(); }
				} else {
					// XXX make this search again in searched chats.
					connect();
				}
			});

			// Other buttons
			$("#user_list_button").click(function() { $("#user_list_container").show(); });
			$("#switch_character_button").click(function() { switch_character.show(); });

			// Connecting and disconnecting
			function connect() {
				status = "chatting";
				launch_long_poll();
				window.setTimeout(ping, 10000);
				$(document.body).addClass("chatting");
				parse_variables();
				scroll_to_bottom();
				abscond_button.text("Abscond");
			}
			function exit() {
				status = "disconnected";
				$(document.body).removeClass("chatting");
				switch_character.hide();
				settings.hide();
				abscond_button.text("Join");
			}
			function disconnect() {
				$.ajax("/chat_api/quit", { "type": "POST", data: { "chat_id": chat.id }, "async": false});
				exit();
			}

			// Now all that's done, let's connect
			connect();

		},
	};
})();
