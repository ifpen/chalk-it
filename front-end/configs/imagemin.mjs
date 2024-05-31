import imagemin from 'imagemin-overwrite';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';

const DETAIL_LOG = false;

const files = await imagemin(['build/assets/*.{jpg,jpeg,png,svg}', 'build/doc/**/*.{jpg,jpeg,png,svg}'], {
  plugins: [
    imageminMozjpeg({}),
    imageminPngquant({}),
    imageminSvgo({
      plugins: ['removeViewBox', 'convertPathData'],
    }),
  ],
});

if (DETAIL_LOG) {
  console.log(files);
} else {
  console.log(`imagemin processed ${files.length} files`);
}
