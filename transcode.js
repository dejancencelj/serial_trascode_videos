var child_process = require('child_process');
var probe = require('node-ffprobe');
var async = require('async');
var _ = require('underscore');
var mkdirp = require('mkdirp');

var INPUT_LOCATION = 'D:/2006';
var OUTPUT_LOCATION = 'D:/2006_output_dejan_skript';

var ffs = require('final-fs'),
        sys = require('sys'),
        path = require('path'),
        spawn = require('win-spawn'),
        dirPath = path.resolve(__dirname, 'C:/Dropbox/WebProjects/2015/transcodeAva/input');
        dirPath = path.resolve(__dirname, INPUT_LOCATION);


function spawnMencoderOrFfmpeg(fileIn, avdio_b_r, video_b_r, formt_name, exitCallback) {


    var avdio = Math.floor(avdio_b_r / 1000);
    var video = Math.floor(video_b_r / 1000);
    if (formt_name === 'rm') {
        var args;
        var fileOut;
        if (video_b_r == 0) {
            fileOut = fileIn.replace('.RM', '.mp3').replace(INPUT_LOCATION, OUTPUT_LOCATION);
            //args = [fileIn, '-ovc', 'frameno', '-oac', 'mp3lame', '-of rawaudio', '-lavcopts', 'acodec=mp3:abitrate=' + avdio, '-o', fileOut, '-of', 'mpg'];

            args = ['-i', fileIn, '-map', '0:2', '-c:a:2', 'libmp3lame', '-b:a:2', avdio + 'k', fileOut];

            var ffmpeg = spawn('ffmpeg', args);

            ffmpeg.stderr.on('data', function (data) {
                console.log('grep stderr: ' + data);
            });

            ffmpeg.stdout.on('data', function (data) {
                console.log('grep : ' + data);
            });

            console.log('Spawning ffmpeg ' + args.join(' '));
            ffmpeg.on('exit', exitCallback);


        } else {
            fileOut = fileIn.replace('.RM', '.mp4').replace(INPUT_LOCATION, OUTPUT_LOCATION);
            args = [fileIn, '-ovc', 'x264', '-x264encopts', 'threads=auto:pass=1:turbo:bitrate=' + video + ':frameref=5:bframes=3:me=umh:partitions=all:trellis=1:qp_step=4:qcomp=0.7',
                '-oac', 'mp3lame', '-lavcopts', 'acodec=mp3:abitrate=' + avdio, '-o', fileOut, '-of', 'lavf'];

            var mencoder = spawn('mencoder', args);

            mencoder.stderr.on('data', function (data) {
                console.log('grep stderr: ' + data);
            });

            mencoder.stdout.on('data', function (data) {
                console.log('grep : ' + data);
            });

            console.log('Spawning mencoder ' + args.join(' '));
            mencoder.on('exit', exitCallback);
        }
    }
    else if (formt_name === 'asf') {
        var args;
        var fileOut;
        if (video_b_r == 0) {
            fileOut = fileIn.replace('.WMA', '.mp3').replace(INPUT_LOCATION, OUTPUT_LOCATION);
            //args = [fileIn, '-ovc', 'frameno', '-oac', 'mp3lame', '-of rawaudio', '-lavcopts', 'acodec=mp3:abitrate=' + avdio, '-o', fileOut, '-of', 'mpg'];

            args = ['-i', fileIn, '-q:a', '3', '-y', fileOut];

            var ffmpeg = spawn('ffmpeg', args);

            ffmpeg.stderr.on('data', function (data) {
                console.log('grep stderr: ' + data);
            });

            ffmpeg.stdout.on('data', function (data) {
                console.log('grep : ' + data);
            });

            console.log('Spawning ffmpeg ' + args.join(' '));
            ffmpeg.on('exit', exitCallback);


        } else {

            console.log('NIMAMO PODPORE ZA VIDEO');
        }
    } else {

        console.log('nepodprt format');
    }




}
//var ffmpeg = spawnFfmpeg(
//        function (code) { // exit
//            console.log('child process exited with code ' + code);
//            
//        });
//console.log(fileList);

//Funcija prevere iz direktorijske strukture
ffs.readdirRecursive(dirPath, true, '')
        .then(function (files) {


            //CREATE FOLDERS
            _.each(files, function (item) {
                //console.log(item);
                var koncnica = item.split('.');
                if (koncnica[1] !== 'RM') {
                    //console.log(item);
                }

                var folder = item;
                var index = folder.lastIndexOf('/');
                folder = folder.substr(0, index);
                
                var folder = OUTPUT_LOCATION + '/' + folder;
                //console.log(index + ' ' + folder);
                mkdirp(folder, function (err) {

                    // path was created unless there was error

                });

            });
        
            j = 0;
            transcodeClb();

            function transcodeClb() {
                var item = files[j];
                if (item !== '' && typeof item !== 'undefined') {
                    var file = INPUT_LOCATION + '/' + item;
                    console.log(file);

                    probe(file, function (err, probeData) {

                        console.log(probeData.format);
                        if (typeof probeData === 'object') {
                            console.log('File type: ' + probeData.format.format_name);
                            console.log('File bitrate: ' + probeData.format.bit_rate);
                            //console.log(probeData.streams);
                            var audio_bit_rate = 0;
                            var video_bit_rate = 0;
                            _.each(probeData.streams, function (item) {
                                //console.log(item.codec_type)
                                if (item.codec_type === 'audio') {
                                    if (audio_bit_rate < Number(item.bit_rate))
                                        audio_bit_rate = Number(item.bit_rate);
                                }
                                if (item.codec_type === 'video') {
                                    if (video_bit_rate < Number(item.bit_rate))
                                        video_bit_rate = Number(item.bit_rate);
                                }

                            });
                            console.log('audio chanel bit rate ' + audio_bit_rate);
                            console.log('video chanel bit rate ' + video_bit_rate);
                            var bitrate = video_bit_rate + audio_bit_rate;
                            console.log('content bitrate ' + bitrate);
                            var fileOut = probeData.format.filename.replace('.RM', '.mp4').replace(INPUT_LOCATION, OUTPUT_LOCATION);
                            console.log('fiel out ' + fileOut);
                           
                            spawnMencoderOrFfmpeg(probeData.format.filename, audio_bit_rate,
                                    video_bit_rate,
                                    probeData.format.format_name,
                                    function (code) { // exit
                                        console.log('child process exited with code ' + code);

                                        if (j < files.length) {
                                            j++;
                                            transcodeClb();
                                        } else {
                                            console.log("Vsi taski koncani...");
                                        }
                                    });

                        }


                    });
                }
            }



            // in files variable you got all the files
        })
        .otherwise(function (err) {
            // something went wrong
        });




