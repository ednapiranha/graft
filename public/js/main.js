var generateImage = function (ev) {
  var preview = document.getElementById('preview');
  var canvas = document.createElement('canvas');
  var picture = ev.target.files[0];
  var img = new Image();

  var MAX_SIZE = 100;

  preview.innerHTML = '';

  var onComplete = function () {
    canvas.width = img.width;
    canvas.height = img.height;

    if (canvas.width > MAX_SIZE) {
      var scale = MAX_SIZE / canvas.width;
      canvas.width *= scale;
      canvas.height *= scale;
    }

    if (canvas.height > MAX_SIZE) {
      var scale = MAX_SIZE / canvas.height;
      canvas.width *= scale;
      canvas.height *= scale;
    }

    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    document.getElementById('photo').value = canvas.toDataURL('image/jpeg', 0.4);
    preview.appendChild(canvas);
  };

  img.onload = img.onerror = onComplete;
  img.src = window.URL.createObjectURL(picture);
};

document.getElementById('photo-picker').addEventListener('change', generateImage, false);

