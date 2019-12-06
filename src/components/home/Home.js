import React, { Component } from 'react';
import axios from 'axios';
import $ from 'jquery';
import './Home.css';
import S3FileUpload from 'react-s3';
import { ScaleLoader } from 'react-spinners';
import { css } from '@emotion/core';

const config = {
  bucketName: process.env.REACT_APP_BUCKET_ORIGINAL_NAME,
  region: process.env.REACT_APP_REGION,
  accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
}

const override = css`
    display: block;
    margin: 0 auto;
    border-color: red;
`;

class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      file: null,
      isLoading: false,
      isFetchingThumbnail: false,
      thumbnailUrls: []
    }
  }

  componentDidMount() {
    this.getAllImages();
  }

  //FETCH ALL THE IMAGES FROM DYNAMODB AND PRESENT IT ON THE PAGE.
  getAllImages = async () => {
    let data = {
      "TableName": process.env.REACT_APP_TABLE_NAME,
      "ReturnConsumedCapacity": "TOTAL"
    }

    console.log(process.env.REACT_APP_DATABASE_URL);
    const response = await axios.get(process.env.REACT_APP_DATABASE_URL, data);
    const images = response["data"]["Items"].map((item) => item.url.S);

    this.setState({
      thumbnailUrls: images
    });
  }

  //UPLOAD IMAGE TO THE S3 BUCKET.(Didnt use API GATEWAY cuz file size limitation of 10 MB)
  //After the image is uploaded a lambda function will 
  //generate the thumbnail in another bucket
  uploadImage = () => {
    if (this.validateFile()) {
      S3FileUpload.uploadFile(this.state.file, config)
        .then(data => this.handleSuccess(data))
        .catch(err => this.handleError(err))
    }
  }

  //VALIDATED THE FILE MEETS ALL THE RESTRICTIONS.
  validateFile = () => {
    let file = this.state.file;
    let MAX_SIZE = 1073741824 // 1 GB in bytes
    let isValid = false;

    if (!file) {
      this.ocShowAlert('Please upload file', 'red');
    } else if (file.size > MAX_SIZE) {
      this.ocShowAlert('Max size: 1 GB', 'red');
    } else if (!this.checkFileType(file)) {
      this.ocShowAlert('File is not an Image', 'red');
    } else {
      isValid = true;
    }

    return isValid;
  }

  //ON FILE UPLOADED
  handleSuccess = (data) => {
    this.setState({
      file: null
    }, () => {
      this.saveThumbnail(data);
      this.ocShowAlert('File Uploaded', '#3089cf');
    });
  }

  // ON FILE NOT UPLOADED
  handleError = (err) => {
    this.setState({
      file: null,
      isLoading: false
    },
      () => { this.ocShowAlert('Cant upload right now, try later...', 'red') }
    );

    console.log(err);
  }

  //SAVES THE NAME OF THE FILE, TO LATER BE USED REQUESTING THE THUMBNAIL
  saveThumbnail = async (response) => {
    this.setState({
      isFetchingThumbnail: true
    })

    let data = { "url": response['key'] };
    let images = this.state.thumbnailUrls;

    await axios.post(process.env.REACT_APP_DATABASE_URL, data);

    //AN DELAY WAS ADDED IN CASE THE THUMBNAIL IS NOT YET CREATED.
    setTimeout(() => {
      images.push(response['key']);
      this.setState({
        isLoading: false,
        isFetchingThumbnail: false,
        thumbnailUrls: images
      })
    }, 2000);

  }

  //SINCE FILE IS SELECTED BEGING THE UPLOAD
  onFileSelected = (event) => {
    this.setState({
      file: event.target.files[0],
      isLoading: true
    },
      this.uploadImage
    );
  };

  //CHECKS FILE TYPE
  checkFileType(file) {
    const filetypes = /jpeg|jpg|png|gif|svg|jpe|ico/;
    const mimetype = filetypes.test(file.type);

    return mimetype;
  }

  // SHOW MESSAGE BANNER ON TOP FO THE PAGE
  ocShowAlert = (message, background = '#3089cf') => {
    let alertContainer = document.querySelector('#oc-alert-container'),
      alertEl = document.createElement('div'),
      textNode = document.createTextNode(message);

    alertEl.setAttribute('class', 'oc-alert-pop-up');

    $(alertEl).css('background', background);
    alertEl.appendChild(textNode);
    alertContainer.appendChild(alertEl);

    setTimeout(function () {
      $(alertEl).fadeOut('slow');
      $(alertEl).remove();
    }, 3000);
  };

  //COMPONENT THAT SHOWS ALL THE IMAGES
  ImageGallery = (props) => {
    const images = this.state.thumbnailUrls.map((image) => {
      const urlOriginal = process.env.REACT_APP_BUCKET_ORIGINAL_URL + image;
      const urlThumbnail = process.env.REACT_APP_BUCKET_THUMBNAIL_URL + image;
      return <a href={urlOriginal}>
        <img className="thumbnail-img" src={urlThumbnail} alt="Download Image" onError={this.getAllImages}></img>
      </a>
    });

    return (<ul>{images}</ul>);
  }

  ShowStatus = () => {
    let message;
    if (!this.state.isFetchingThumbnail) {
      message = "Uploading...";
    } else {
      message = "Creating Thumbnail..."
    }

    return <p className="requirements-text">{message}</p>;
  }

  render() {
    return (
      <div className="container">
        <div id="oc-alert-container"></div>
        <div>
          <div className="header-container">
            <img className="logo" src="logo.png" alt="logo"></img>
          </div>
          <div className="body-container">
            <h1>Your Designs</h1>

            {this.state.thumbnailUrls && <this.ImageGallery />}
            {this.state.isLoading &&
              <div>
                <ScaleLoader css={override} sizeUnit={"px"} size={15} width={2} color={'#231f20'} loading={this.state.isLoading} />
                <this.ShowStatus />
              </div>}
            {!this.state.isLoading &&
              <div>
                <p className="card-text">Please upload your Designs</p>
                <input type="file" name="file" id="file" accept="image/jpeg, image/png, image/gif " onChange={this.onFileSelected} />
                <label htmlFor="file">
                  <span>UPLOAD</span>
                </label>
                <p className="requirements-text">Upload Size: Max 1 GB</p>
                <p className="requirements-text">File Types: jpeg | jpg | png  | jpe </p>
              </div>}
          </div>
        </div>
      </div>
    );
  }
}

export default Home;