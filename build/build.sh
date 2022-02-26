BUILD_ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [[ ${BUILD_ROOT_DIR} != *"/build"* ]]
then
  BUILD_ROOT_DIR="$BUILD_ROOT_DIR/build"
fi
ROOT_DIR=$(dirname "${BUILD_ROOT_DIR}")

cd ${ROOT_DIR}

npm install

echo "Done..."
