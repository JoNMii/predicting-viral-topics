# Predicting viral topics on social media
- Author: Eric Gopak
- Affiliation: Technische Universität München
- Last updated: 24.09.2016

## Contents
1. [Introduction](#1-introduction)
2. [Code structure](#2-code-structure)
3. [Requirements](#3-requirements)
4. [Tutorial](#4-tutorial)

# 1 Introduction

All the code in this folder has been implemented as part of an interdisciplinary project at Technische Universität München, which was conducted during the summer of year 2016.
This file presents a guide that helps you navigate the code used for the research.
The code is referred to an academic paper, which is potentially to be submitted to ECIS 2017 (http://aisel.aisnet.org/ecis/).

# 2 Code structure
The code is structured into 4 parts:

1. **Data collection** - a collection of Node.js scripts for crawling and parsing articles as well as retrieving their corresponding Open Graph social stats

2. **Simple regressions** - a simple MS Excel file with LINEST and LOGEST functions applied and visualized. These simple regressiosn try to make predictions based on different textual properties of articles (e.g. reading complexity)

3. **Logistic regression** - a collection of MATLAB scripts for calculating and visualizing logistic regression in various configurations on the collected data. The logistic regression tries to make predictions based on different textual properties of articles (e.g. reading complexity)

4. **Machine learning** - a convolutional neural network (CNN) approach to predicting virality of an article based on its textual data

Each of the parts is designed to be maximally independent of each other. However, all parts rely on the data collected in part 1.
Here is a more detailed description of the file structure:

```bash
.
├── 1. data collection
│   ├── bin
│   │   └── wget.exe        # a pre-packaged binary, used by crawler.js
│   ├── complexity.js       # calculates readability scores
│   ├── crawler.js          # crawls web pages according to config
│   ├── crawler-config.json # rules for crawling individual hosts
│   ├── data
│   │   └── articles.csv    # all the collected articles in CSV format
│   ├── downloads           # crawler puts downloaded pages here by default
│   │   ├── www.entrepreneur.com
│   │   ├── www.finextra.com
│   │   └── www.investopedia.com
│   ├── get-social-stats.js  # retrieves Open Graph data for given URLs
│   ├── jquery-3.1.0.min.js  # a local jQuery copy for parser.js
│   ├── package.json         # dependencies and convenience commands
│   ├── parser.js            # parses text out of the downloaded HTML
│   └── tools # set of scripts for convenience
│       ├── export_mongodb_to_csv.bat # write out all articles to CSV file
│       ├── printout_mongodb_data.js  # similarly, but with Node.js
│       ├── test_single.js            # Open Graph API request test
│       ├── scopus
│       │   └── get_articles_data.js   # collect article abstracts via Scopus API
│       └── twitter
│           ├── get_tweets_rest.js   # collect tweets via REST API
│           └── get_tweets_stream.js # collect tweets via Streaming API
├── 2. simple regressions
│   └── Simple_regressions.xlsx  # Excel file with LINEST, LOGEST and graphs
├── 3. logistic regression
│   ├── costFunction.m     # calculates cost function of logistic regression
│   ├── costFunctionReg.m  # similarly, for regularized logistic regression
│   ├── idp.m              # main file
│   ├── idp_data.txt       # input data (readability scores + FB shares)
│   ├── mapFeature2.m      # maps input features to quadratic features
│   ├── mapFeature3.m      # similarly, to cubic features
│   ├── mapFeature5.m      # similarly, to quintic features
│   ├── plotData2.m        # plots 2-dimensional data
│   ├── plotDecisionBoundary.m # similarly, but with decision boundary
│   ├── predict.m          # predicts virality based on calculated theta
│   └── sigmoid.m          # sigmoid logistic function
├── 4. machine learning
│   ├── data
│   │   ├── articles_text_neg.csv  # articles chosen as negative
│   │   └── articles_text_pos.csv  # articles chosen as positive
│   ├── data_helpers.py # helper functions for manipulating input data
│   ├── eval.py         # perform prediction using trained model
│   ├── LICENSE
│   ├── README.md       # Read this file for reference
│   ├── text_cnn.py     # Definition of TextCNN object
│   └── train.py        # Main file - trains the CNN and evaluates it regularly
└── README.md  # this file
```

# 3 Requirements
In this section you can find software prerequisites for each of the parts.

## 3.1 Data collection
- Node.js (https://nodejs.org/en/) - it is assumed that `npm` and `node` are available in `PATH`
- MongoDB (https://www.mongodb.com/) - it is assumed that MongoDB server (`mongod`) is running locally on your machine

## 3.2 Simple regressions
- Microsoft Excel (https://products.office.com/en-us/excel)

## 3.3 Logistic regression
- MATLAB or Octave (www.mathworks.com/products/matlab/index.html or https://www.gnu.org/software/octave/) - the code was tested mostly with MATLAB, but should be compatible with Octave as well

## 3.4 Machine learning
- Python3 (recommended) (https://www.python.org/downloads/)
- TensorFlow (https://www.tensorflow.org/)
- Numpy (http://www.numpy.org/)
- we recommend Anaconda (https://www.continuum.io/downloads), which is packaged with Python3 and Numpy be default, and TensorFlow installs flawlessly with it (https://www.tensorflow.org/versions/r0.10/get_started/os_setup.html#anaconda-installation)

# 4 Tutorial
You can follow instructions in this section in order to re-create the results attained during a research project on prediction of virality of online articles based on its social network data (in this work we only use Open Graph statistics, like Facebook shares).

These are high-level instructions. For the best understanding, refer to the code itself, read its comments and feel free to tweak it to your liking.

## 4.1 Data collection
*Note:* for your convenience, collected articles with all the data a neatly stored in `data/articles.csv`, so you can skip this part if you prefer importing the data from the CSV file into your MongoDB database. We nevertheless encourage you to at least look through the steps described further.

This part is written in Node.js. As usually, begin by running
```bash
npm install
```
which will fetch the dependencies specified in `package.json`.

For your convenience, helper commands are defined in `package.json`. Run them in the following sequence in order to collect all the required data:
```bash
npm run crawler
```
This will read `crawler-config.json` and crawl the hosts according to the specified rules. Recursive crawling is done with the help of `Wget`, which resides locally in `bin` folder. Feel free to replace it with another binary (e.g. if you wish to update it, use specific version, or use Linux executable - our Node.js scripts are designed to be platform-independent).
Downloaded articles will be put under `download` folder.
```bash
`npm run get-social-stats`
```
This will traverse collected HTML files, perform Facebook Open Graph API requests for retrieving social stats (FB shares, likes, comments, etc.) and save it all into a MongoDB database.
```bash
`npm run parser`
```
This will iterate over all database records of the articles, take their HTML code and parse plain text out of it, as specified in a config (hard-coded in `parser.js`). Finally, it updates database records with the plaintexts.
```bash
`npm run complexity`
```
This final step will iterate over all database records once again while taking plaintexts of the articles an calculating various readability scores on them. And, somewhat traditionally, it will save it back to the database.

If you have executed the scripts in this sequence and have not encountered any errors on your way, then with the default settings you should end up having a local MongoDB database `idp` with a collection `articles` which consists of around ~11,000 articles with their corresponding HTML, text, Facebook social stats and readability scores. Feel free to proceed to the next section.

## 4.2 Simple regressions

In this section we perform predictions using linear and exponential regressions. Fortunately for you, all the calculations have been made and are in the file `Simple_regressions.xlsx`.
For linear regressions MS Excel offers `LINEST` function and for exponential regression it offer `LOGEST`, which we used. For measuring performance we used MSE (mean square error) - it is calculated below the LINEST and LOGEST columns.
Also, although all the data is on the first sheet, feel free to investigate the visualisation on the second sheet.

## 4.3 Logistic regressions
In this section we implemented logistic regression in the form of MATLAB scripts. The predictions are made similarly to the simple regressions, i.e. selecting readability scores as input vectors.
*Note: Octave is an open-source alternative to MATLAB, consider using it in case if MATLAB is not available to you.*

The main file is `idp.m`, where all computation steps are explicitly commented. Make sure to follow through them and uncomment the parts of the code that you are interested in. You can uncomment corresponding parts of the code to work for 2, 3 or 5-dimensional input vectors.
The purpose of the remaining files is described in their headers.

The input data has been put into a matrix form for you (see `idp_data.txt`). If you wish to change or re-create it, feel free to use the tools from `1. data collection/tools` folder.

The code was inspired by and forked from practical assignments from Coursera course on machine learning: https://www.coursera.org/learn/machine-learning/

## 4.4 Machine learning
In this section we use machine-learning approach, which, as initially anticipated, should have been the most promising one.
At the core of the approach are convolutional neural networks (CNNs), the approach we used is based on Kim Yoon’s Convolutional Neural Networks for Sentence Classification (http://arxiv.org/abs/1408.5882), and the code is adapted from https://github.com/dennybritz/cnn-text-classification-tf, which is a complementary code for the following article: http://www.wildml.com/2015/12/implementing-a-cnn-for-text-classification-in-tensorflow/.

In order for you to understand what is going on here, we highly suggest to read the blog post and the paper mentioned above.

Assuming you got your prerequisites ready (including Python3, Numpy and TensorFlow locally installed), the only thing you need to do is to run
```bash
python train.py
```
from `4. machine learning` directory.

The script will then start training a convolutional neural network and automatically perform evaluation of the prediction model after every 50 steps (defined by `evaluate_every` flag in `train.py`). Feel free to change the parameters in `train.py` to suit your liking.

With this approach we achieved a prediction accuracy of 61.27%. Is this good? Is this bad? It can be better for sure, but our purpose was to introduce the idea, and we believe we succeeded in doing so. Read the paper for more details and greater analysis.
