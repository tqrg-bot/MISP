function toggleVisiblity(termId, auto, show) {
    var term = $('div[data-terminalid='+termId+']')
    if (auto === true) {
        if (term.data('manual') !== true) { //  show if manual is not set
            if (show === true) {
                term.show();
            } else if (show === false) {
                term.hide();
            } else {
                term.toggle();
            }
        }
    } else {
        term.data('manual', true);
        if (show === true) {
            term.show();
        } else if (show === false) {
            term.hide();
        } else {
            term.toggle();
        }
    }
}

var pooler;
var poolerInterval = 3000;
$(document).ready(function() {
    pooler = setInterval(function() { update_state(); }, poolerInterval);
});


function update_state() {
    $.getJSON(urlGetProgress, function(data) {
        var tot = parseInt(data['tot']);
        var cur = parseInt(data['cur']);
        var failArray = data['failed_num'];
        for (var i=0; i<tot; i++) {
            var term = $('div[data-terminalid='+i+']')
            toggleVisiblity(i, true, false);   
            if (i < cur) {
                if (failArray.indexOf(String(i)) != -1) {
                    update_row_state(i, 2);
                } else {
                    update_row_state(i, 0);
                }
            } else if (i == cur) {
                if (failArray.indexOf(String(i)) != -1) {
                    update_row_state(i, 2);
                    toggleVisiblity(i, true, true);   
                } else {
                    update_row_state(i, 1);
                    toggleVisiblity(i-1, true, true);   
                }
                update_single_update_progress(i, data);
            } else {
                update_row_state(i, 3);
            }
        }
        update_messages(data);
        if (tot > 0) {
            var percFail = Math.round(failArray.length/tot*100);
            var perc = Math.round((cur)/tot*100);
            update_pb(perc, percFail);
        }

        if ((cur+1) >= tot || failArray.indexOf(cur) != -1) {
            clearInterval(pooler);
            $('.single-update-progress').hide();
        }
    });
}


function update_messages(messages) {
    if (messages.cmd === undefined) {
        return;
    }
    messages.cmd.forEach(function(msg, i) {
        var div = $('#termcmd-'+i);
        create_spans_from_message(div, msg);
    });
    messages.res.forEach(function(msg, i) {
        var div = $('#termres-'+i);
        div.css('display', '');
        create_spans_from_message(div, msg);
    });
    messages.time.started.forEach(function(startedText, i) {
        var elapsedText = messages.time.elapsed[i];
        if (elapsedText === undefined) {
            var diff = new Date((new Date()).getTime() - (new Date(startedText)).getTime());
            elapsedText = pad(diff.getUTCHours(), 2)
                + ':' + pad(diff.getUTCMinutes(), 2)
                + ':' + pad(diff.getUTCSeconds(), 2);
        }
        update_times(i, startedText, elapsedText)
    });
}

function create_spans_from_message(toAppendto, msg) {
    toAppendto.empty();
    // create span for each line of text
    msg = msg.replace(/^\n*\s+/, '');
    var lines = msg.split(/\s{2,}/m)
    lines.forEach(function(line, j) {
        var pad = j > 0 ? '30' : '0';
        if (line !== '') {
            var span = $('<span style="margin-left: ' + pad + 'px;">' + line + '</span>');
            toAppendto.append(span);
        }
    });
}

function update_row_state(i, state) {
    var icon = $('#icon-'+i);
    var row = $('#row-'+i);
    switch(state) {
        case 0: // success
            row.removeClass('alert-danger alert-info');
            row.addClass('alert-success');
            icon.removeClass('fa-times-circle-o fa-cogs');
            icon.addClass('fa-check-circle-o');
            break;
        case 1: // current
            row.removeClass('alert-success alert-danger');
            row.addClass('alert-info');
            icon.removeClass('fa-check-circle-o', 'fa-times-circle-o');
            icon.addClass('fa-cogs');
            break;
        case 2: //fail
            row.removeClass('alert-success alert-info');
            row.addClass('alert-danger');
            icon.removeClass('fa-check-circle-o fa-cogs');
            icon.addClass('fa-times-circle-o');
            break;
        case 3: //no state
        default:
            row.removeClass('alert-success alert-info alert-danger');
            icon.removeClass('fa-check-circle-o fa-times-circle-o fa-cogs');
            break;
    }
}

function update_pb(perc, percFail) {
    var pb = $('#pb-progress');
    pb.css('width', perc+'%');
    pb.text(perc+'%');
    var pbF = $('#pb-fail');
    pbF.css('width', percFail+'%');
}

function update_times(i, startedText, elapsedText) {
    var started = $('#startedTime-'+i);
    var elapsed = $('#elapsedTime-'+i);
    started.text(startedText);
    elapsed.text(elapsedText);
}

function update_single_update_progress(i, data) {
    $('.single-update-progress').hide();
    var div = $('#single-update-progress-'+i);
    var pb = div.find('#single-update-pb-'+i);
    var state = div.find('#small-state-text-'+i);
    div.show();
    var perc = parseInt(data['process_list']['PROGRESS']);
    if (data['process_list']['MAX_STAGE'] == 0) { // if MAX_STAGE == 0, progress could not be determined
        perc = 5;
        if (data['failed_num'].indexOf(data['cur']) >= 0) { // do not animate if failed
            state.text('Failed');
            perc = 0;
        } else {
            state.text('Unkown or No state');
            pb.addClass('back-and-forth-animation');
        }
    } else {
        perc = perc == 0 ? 1 : perc; // for UI, always set min progress to 1
        pb.removeClass('back-and-forth-animation');
        state.text(data['process_list']['STATE']);
    }
    pb.css('width', perc+'%');
}

function pad(num, size){ return ('000000000' + num).substr(-size); }
