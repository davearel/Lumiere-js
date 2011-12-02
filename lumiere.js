
(function($, exports){

    var Lumiere = function(id) {
        this.id = id;
        this.init();
    };

    Lumiere.prototype = Lumiere.fn = {
        init: function() {

            this.media = document.getElementById(this.id);
            this.$media = $(this.media);
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
            this.$control_volume.bind('mousedown', $.proxy(this.slideVolume, this))
            this.$timeline_track.bind('mousedown', $.proxy(this.scrubTimeline, this));
            this.$media.bind({
                timeupdate: $.proxy(this.updateTime, this),
                loadedmetadata: $.proxy( function() {

                    this.setDuration();
                    this.initVolumeControls();

                }, this)
            });

        },

        // ****************************
        // PLAY / PAUSE / MUTE CONTROLS
        // ****************************

        play: function() {
            this.media.play();
            this.trackPlayProgress();
        },

        pause: function() {
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
        
        trackPlayProgress: function (){
            this.play_progress = setInterval($.proxy(this.updatePlayProgress, this), 33);
        },
     
        stopTrackingPlayProgress: function (){
            clearInterval(this.play_progress);
        },

        updatePlayProgress: function (){
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
                "mousemove.timeline": $.proxy(function(e) {
                    // If mouse moves, 
                    // track and set location
                    this.videoSeek(e.pageX);
                }, this),
                // When user lets go of mouse click:
                // unbined events
                "mouseup.timeline": function(e) {
                    // this = document
                    $this = $(this);
                    $this.off('mousemove.timeline');
                    $this.off('mouseup.timeline');
                }
            });
      
        },

        videoSeek: function (xClick) {
            var
            // find left offset
            timeline_track_offset = this.$timeline_track.offset(),
            left_offset = xClick - timeline_track_offset.left,
            timeline_max = this.$timeline_track.outerWidth(),
            duration = this.media.duration;

            if (left_offset <= 0) {
                left_offset = 0;
            } else if (left_offset >= timeline_max ) {
                left_offset = timeline_max;
            }

            var new_perc = (left_offset / timeline_max) * 100;
            var new_time = (new_perc / 100) * duration;

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
                "mousemove.volume": $.proxy(function(e) {
                    // If mouse moves, 
                    // track and set location
                    this.setVolumePosition(e);
                }, this),
                // When user lets go of mouse click:
                // unbined events
                "mouseup.volume": function(e) {
                    // this = document
                    $this = $(this);
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
            } else if (left_offset >= this.volume_max ) {
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
            m = Math.floor(sec/60)<10?"0"+Math.floor(sec/60):Math.floor(sec/60),
            // seconds
            s = Math.floor(sec-(m*60))<10?"0"+Math.floor(sec-(m*60)):Math.floor(sec-(m*60));
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
        },

    }

    exports.Lumiere = Lumiere;

})(jQuery, window);
