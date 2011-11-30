var lumiere = (function($) {

    var
    video, play_progress,
    
    volume_track_width, volume_handle_width, 
    volume_wrapper_width, volume_max, volume_track_offset, 

    timeline_track_width, timeline_progress_width, 
    timeline_track_offset, timeline_max,
    
    $control = {},
    $timeline = {};

    function init(id) {
        video = document.getElementById(id);
        $video = $(video);
        $control.wrap = $('.lumiere-vid');
        $control.time = $('.lu_currentTime', $control.wrap);
        $control.duration = $('.lu_durationTime', $control.wrap);
        $control.play = $('.lu_play', $control.wrap);
        $control.mute = $('.lu_mute', $control.wrap);
        $control.volume = $('.lu_volume', $control.wrap);
        $control.volHandle = $('.lu_vol_handle', $control.wrap);
        $control.volTrack = $('.lu_vol_track', $control.wrap);
        $timeline.track = $('.lu_time_track', $control.wrap);
        $timeline.played = $('.lu_time_played', $control.wrap);
        $timeline.loadProgress = $('.lu_time_load', $control.wrap);
        
        // Bind Events
        $control.play.bind('click', togglePlay);
        $control.mute.bind('click', toggleMute);
        $control.volume.bind('mousedown', slideVolume)
        $timeline.track.bind('mousedown', scrubTimeline);

        $video.bind({
            timeupdate: updateTime,
            //progress: loadProgress,
            loadedmetadata: function() {
                
                setDuration();
                initVolumeControls();
            }
        });
    }


    /* 
     * PLAY/PAUSE CONTROLS
     *
     * */

    function togglePlay() {
        if (video.paused) {
            playVideo();
        } else {
            pauseVideo();
        }
    }

    function toggleMute() {
        if (video.muted) {
            video.muted = false;
        } else {
            video.muted = true;
        }
    }

    function playVideo() {
        video.play();
        trackPlayProgress();
    }

    function pauseVideo() {
        video.pause();
        stopTrackingPlayProgress();
    }


    /* 
     * TIMELINE CONTROLS
     *
     * */

    function initTimelineTrack() {
        // Get widths of track
        timeline_track_width = $control.volTrack.width();
    }

    function trackPlayProgress(){
        play_progress = setInterval(updatePlayProgress, 33);
    }
     
    function stopTrackingPlayProgress(){
        clearInterval(play_progress);
    }

    function updatePlayProgress(){
        var
        // current time
        ct = video.currentTime,
        // video duration
        vd = video.duration,
        // progress track width
        bar_width = $timeline.track.outerWidth();
        // update progress bar width
        $timeline.played.width((ct / vd) * bar_width);
    }

    function formatTime(sec) {
        var 
        // minutes
        m = Math.floor(sec/60)<10?"0"+Math.floor(sec/60):Math.floor(sec/60),
        // seconds
        s = Math.floor(sec-(m*60))<10?"0"+Math.floor(sec-(m*60)):Math.floor(sec-(m*60));
        // return formatted time
        return m + ":" + s;
    }

    function updateTime(e) {
        var 
        // log current time
        time = e.target.currentTime,
        // format current time
        time_f = formatTime(time);
        // append to DOM
        $control.time.text(time_f);
    }

    function setDuration() {
        var
        // log duration time
        time = video.duration,
        // format duration
        time_f = formatTime(time);
        // append to DOM
        $control.duration.text(time_f);
    }

    function scrubTimeline(e) {
        // prevent all default actions
        e.preventDefault();

        // Immediately set seek position position
        videoSeek(e.pageX);

        // bind events
        $(document).on({
            // While mouse is still clicked: 
            // check for drag
            "mousemove.timeline": function(e) {
                // If mouse moves, 
                // track and set location
                videoSeek(e.pageX);
            },
            // When user lets go of mouse click:
            // unbined events
            "mouseup.timeline": function(e) {
                // this = document
                $this = $(this);
                $this.off('mousemove.timeline');
                $this.off('mouseup.timeline');
            }
        });
  
    }

    function videoSeek(xClick) {
        var
        // find left offset
        timeline_track_offset = $timeline.track.offset(),
        left_offset = xClick - timeline_track_offset.left,
        timeline_max = $timeline.track.outerWidth(),
        duration = video.duration;

        if (left_offset <= 0) {
            left_offset = 0;
        } else if (left_offset >= timeline_max ) {
            left_offset = timeline_max;
        }

        var new_perc = (left_offset / timeline_max) * 100;
        var new_time = (new_perc / 100) * duration;

        // Set new time
        video.currentTime = new_time;
        
        // Update timeline progress width
        $timeline.played.width(left_offset);
    }

    /* 
     * VOLUME CONTROLS
     *
     * */

    function initVolumeControls() {
        // Get widths of volume controls
        //volume_wrapper_width = $control.volume.width();
        volume_track_width = $control.volTrack.width();
        volume_handle_width = $control.volHandle.width();

        // Set volume control settings based on styles
        volume_max = volume_track_width - volume_handle_width;
       
        // Set current volume
        $control.volHandle.css('left', video.volume * volume_max);        
    }


    function slideVolume(e) {
        // prevent all default actions
        e.preventDefault();

        // Immediately set volume position
        setVolumePosition(e);

        // bind events
        $(document).on({
            // While mouse is still clicked: 
            // check for drag
            "mousemove.volume": function(e) {
                // If mouse moves, 
                // track and set location
                setVolumePosition(e);
            },
            // When user lets go of mouse click:
            // unbined events
            "mouseup.volume": function(e) {
                // this = document
                $this = $(this);
                $this.off('mousemove.volume');
                $this.off('mouseup.volume');
            }
        });
        
    }

    function setVolumePosition(e) {
        var 
        // find left offset
        volume_track_offset = $control.volTrack.offset(),
        left_offset = e.pageX - volume_track_offset.left;

        if (left_offset <= 0) {
            left_offset = 0;
        } else if (left_offset >= volume_max ) {
            left_offset = volume_max;
        }
        
        // Set volume level
        video.volume = left_offset / volume_max;
        
        // Set volume control
        $control.volHandle.css('left', left_offset);
    }

    return {
        init: init
    }

}(jQuery));
