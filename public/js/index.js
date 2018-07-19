var ws = new WebSocket('ws://127.0.0.1:65301')

$(document).ready(function () {
  $('.delete-btn').click(function () {
    var index = $(this).closest('tr').attr('index')
    $.post('/delete', { index: index }, function (result) {
      if (result.success) {
        M.toast({ html: 'Successfuly Deleted' })
        window.location.reload()
      } else {
        M.toast({ html: result.message })
      }
    })
  })

  $('.stop-btn').click(function () {
    var index = $(this).closest('tr').attr('index')
    $.post('/stop', { index: index }, function (result) {
      if (result.success) {
        M.toast({ html: 'Successfuly Stopped' })
        window.location.reload()
      } else {
        M.toast({ html: result.message })
      }
    })
  })

  $('.start-btn').click(function () {
    var index = $(this).closest('tr').attr('index')
    $.post('/start', { index: index }, function (result) {
      if (result.success) {
        M.toast({ html: 'Successfuly Started' })
        window.location.reload()
      } else {
        M.toast({ html: result.message })
      }
    })
  })

  $('.log-btn').click(function () {
    $('#logModal').modal('open');
    var index = $(this).closest('tr').attr('index')
    $('#logIndex').val(index)
    ws.send(JSON.stringify({
      action: 'attach',
      index: index
    }))
    $('#logBox').html('')
    ws.onmessage = function(message){
      var data = JSON.parse(message.data)
      console.log(data)
      if(data.type == 'update') {
        $('#logBox')[0].innerHTML += data.update
      } else if(data.type=='attach') {
        $('#logBox').html(data.last)
      }
    }
  });

  $('.close-log').click(function () {
    var index = $('#logIndex').val()
    ws.send(JSON.stringify({
      action: 'deattach',
      index: index
    }))
    $('#logModal').modal('close');
  });

  $('.add-app').click(function () {
    $('#addModal').modal('open');
  });

  $('.add-app-submit').click(function () {
    $.post('/add-app', {
      name: $('#app_name').val(),
      args: $('#app_args').val().split(' '),
      path: $('#app_path').val(),
      keepUp: $('#app_keepup').prop('checked'),
    }, function(result){
      if(result.success) {
        M.toast({ html: 'Successfuly Added' })
        window.location.reload()
      }
    })
    $('#addModal').modal('close');
  });

  $('#logModal').modal();
  $('#addModal').modal();
});