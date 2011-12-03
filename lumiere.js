(function ($, exports, document) {

    var
        tmpl_cache = {}, tmpl,
        lumiere_config = {
            tmpl: '<div class="lumiere-vid"><%= media_tag %><button class="lu_play">play</button><button class="lu_mute">mute</button><span class="lu_currentTime">00:00</span><span class="lu_durationTime">00:00</span><span class="lu_volume" id="volume"><span class="lu_vol_track"><span class="lu_vol_handle"></span></span></span><span class="lu_timeline"><span class="lu_time_track"><span class="lu_time_load"></span><span class="lu_time_played"></span></span></span></div>'
        },

        Lumiere = function (id) {
            this.id = id;
            this.init();
        };

    Lumiere.prototype = Lumiere.fn = {
        init: function () {

            // Cache media element
            this.media = document.getElementById(this.id);
            this.$media = $(this.media);

            // Create video wrapper
            this.wrapMedia();

            // Cache all control/timeline elements
            this.$control_wrap = this.$media.parent('.lumiere-vid');
            this.$control_time = $('.lu_currentTime', this.$control_wrap);
            this.$control_duration = $('.lu_durationTime', this.$control_wrap);
            this.$control_play = $('.lu_play', this.$control_wrap);
            this.$control_mute = $('.lu_mute', this.$control_wrap);
            this.$control_volume = $('.lu_volume', this.$control_wrap);
            this.$control_volHandle = $('.lu_vol_handle', this.$control_wrap);
            this.$control_volTrack = $('.lu_vol_track', this.$control_wrap);
            this.$timeline_track = $('.lu_time_track', this.$control_wrap);
            this.$timeline_played = $('.lu_time_played', this.$control_wrap);
            this.$timeline_loadProgress = $('.lu_time_load', this.$control_wrap);

            // Bind Events
            this.$control_play.bind('click', $.proxy(this.togglePlay, this));
            this.$control_mute.bind('click', $.proxy(this.toggleMute, this));
            this.$control_volume.bind('mousedown', $.proxy(this.slideVolume, this));
            this.$timeline_track.bind('mousedown', $.proxy(this.scrubTimeline, this));
            this.$media.bind({
                timeupdate: $.proxy(this.updateTime, this),
                loadedmetadata: $.proxy(function () {

                    this.setDuration();
                    this.initVolumeControls();

                }, this)
            });

        },

        // This will wrap the video in a 
        // predefined or custom html structure
        wrapMedia: function () {
            var
                // create a placeholder for our media element
                media_plc = $('<div class="lumiere_vid_placeholder" />'),
                // make a copy of the html
                media_el = $('<div>').append(media_plc.clone()).remove().html();

            this.$media.after(
                tmpl(lumiere_config.tmpl, {
                    media_tag: media_el
                })
            );
            // And finally, move our video into it's place
            $('.lumiere_vid_placeholder').replaceWith(this.$media);
        },

        // ****************************
        // PLAY / PAUSE / MUTE CONTROLS
        // ****************************

        play: function () {
            this.media.play();
            this.trackPlayProgress();
        },

        pause: function () {
            this.media.pause();
            this.stopTrackingPlayProgress();
        },

        togglePlay: function () {
            if (this.media.paused) {
                this.play();
            } else {
                this.pause();
            }
        },

        toggleMute: function () {
            if (this.media.muted) {
                this.media.muted = false;
            } else {
                this.media.muted = true;
            }
        },

        // ***************
        // TIMELINE TRACK
        // ***************

        trackPlayProgress: function () {
            this.play_progress = setInterval($.proxy(this.updatePlayProgress, this), 33);
        },

        stopTrackingPlayProgress: function () {
            clearInterval(this.play_progress);
        },

        updatePlayProgress: function () {
            var
                // current time
                ct = this.media.currentTime,
                // video duration
                vd = this.media.duration,
                // progress track width
                bar_width = this.$timeline_track.outerWidth();

            // update progress bar width
            this.$timeline_played.width((ct / vd) * bar_width);
        },

        scrubTimeline: function (e) {
            // prevent all default actions
            e.preventDefault();

            // Immediately set seek position position
            this.videoSeek(e.pageX);

            // bind events
            $(document).on({
                // While mouse is still clicked: 
                // check for drag
                "mousemove.timeline": $.proxy(function (e) {
                    // If mouse moves, 
                    // track and set location
                    this.videoSeek(e.pageX);
                }, this),
                // When user lets go of mouse click:
                // unbined events
                "mouseup.timeline": function (e) {
                    // this = document
                    var $this = $(this);
                    $this.off('mousemove.timeline');
                    $this.off('mouseup.timeline');
                }
            });

        },

        videoSeek: function (xClick) {
            var
                // Find left offset
                timeline_track_offset = this.$timeline_track.offset(),
                left_offset = xClick - timeline_track_offset.left,
                timeline_max = this.$timeline_track.outerWidth(),
                duration = this.media.duration,
                new_perc, new_time;

            if (left_offset <= 0) {
                left_offset = 0;
            } else if (left_offset >= timeline_max) {
                left_offset = timeline_max;
            }

            new_perc = (left_offset / timeline_max) * 100;
            new_time = (new_perc / 100) * duration;

            // Set new time
            this.media.currentTime = new_time;

            // Update timeline progress width
            this.$timeline_played.width(left_offset);
        },


        // ***************
        // VOLUME CONTROLS
        // ***************

        initVolumeControls: function () {
            // Get widths of volume controls
            //volume_wrapper_width = $control.volume.width();
            this.volume_track_width = this.$control_volTrack.width();
            this.volume_handle_width = this.$control_volHandle.width();

            // Set volume control settings based on styles
            this.volume_max = this.volume_track_width - this.volume_handle_width;

            // Set current volume
            this.$control_volHandle.css('left', this.media.volume * this.volume_max);
        },

        slideVolume: function (e) {
            // prevent all default actions
            e.preventDefault();

            // Immediately set volume position
            this.setVolumePosition(e);

            // bind events
            $(document).on({
                // While mouse is still clicked: 
                // check for drag
                "mousemove.volume": $.proxy(function (e) {
                    // If mouse moves, 
                    // track and set location
                    this.setVolumePosition(e);
                }, this),
                // When user lets go of mouse click:
                // unbined events
                "mouseup.volume": function (e) {
                    // this = document
                    var $this = $(this);
                    $this.off('mousemove.volume');
                    $this.off('mouseup.volume');
                }
            });

        },

        setVolumePosition: function (e) {
            var
                // find left offset
                volume_track_offset = this.$control_volTrack.offset(),
                left_offset = e.pageX - volume_track_offset.left;

            if (left_offset <= 0) {
                left_offset = 0;
            } else if (left_offset >= this.volume_max) {
                left_offset = this.volume_max;
            }

            // Set volume level
            this.media.volume = left_offset / this.volume_max;

            // Set volume control
            this.$control_volHandle.css('left', left_offset);
        },

        // ****************************
        // SET PROGRESS TIME / DURATION
        // ****************************

        formatTime: function (sec) {
            var
                // minutes
                m = Math.floor(sec / 60) < 10 ? "0" + Math.floor(sec / 60) : Math.floor(sec / 60),
                // seconds
                s = Math.floor(sec - (m * 60)) < 10 ? "0" + Math.floor(sec - (m * 60)) : Math.floor(sec - (m * 60));

            // return formatted time
            return m + ":" + s;
        },

        updateTime: function (e) {
            var
                // log current time
                time = e.target.currentTime,
                // format current time
                time_f = this.formatTime(time);

            // append to DOM
            this.$control_time.text(time_f);
        },

        setDuration: function () {
            var
                // log duration time
                time = this.media.duration,
                // format duration
                time_f = this.formatTime(time);

            // append to DOM
            this.$control_duration.text(time_f);
        }

    };

    // Simple JavaScript Templating
    // John Resig - http://ejohn.org/ - MIT Licensed
    tmpl = function tmpl(str, data) {
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn = !/\W/.test(str) ?
          tmpl_cache[str] = tmpl_cache[str] ||
            tmpl(document.getElementById(str).innerHTML) :
          
          // Generate a reusable function that will serve as a template
          // generator (and which will be cached).
          new Function("obj",
            "var p=[],print=function(){p.push.apply(p,arguments);};" +
            
            // Introduce the data as local variables using with(){}
            "with(obj){p.push('" +
            
            // Convert the template into pure JavaScript
            str
              .replace(/[\r\t\n]/g, " ")
              .split("<%").join("\t")
              .replace(/((^|%>)[^\t]*)'/g, "$1\r")
              .replace(/\t=(.*?)%>/g, "',$1,'")
              .split("\t").join("');")
              .split("%>").join("p.push('")
              .split("\r").join("\\'")
          + "');}return p.join('');");
        
        // Provide some basic currying to the user
        return data ? fn( data ) : fn;
    };

    exports.Lumiere = Lumiere;
    exports.lumiere_config = lumiere_config;

})(jQuery, window, window.document);
