var generateImage = function (ev) {
  var preview = document.getElementById('preview');
  var canvas = document.createElement('canvas');
  var picture = ev.target.files[0];
  var img = new Image();

  preview.innerHTML = '';

  var onComplete = function () {
    canvas.width = canvas.height = 100;
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    document.getElementById('avatar').value = canvas.toDataURL('image/jpeg', 0.4);
    preview.appendChild(img);
  };

  img.onload = img.onerror = onComplete;
  img.src = window.URL.createObjectURL(picture);
};

document.getElementById('avatar-picker').addEventListener('change', generateImage, false);

