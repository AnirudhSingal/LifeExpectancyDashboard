from flask import Flask, render_template, request, redirect, Response, jsonify, send_file
import numpy as np
import pandas as pd
import json
import math
import csv
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import euclidean_distances
from sklearn.manifold import MDS
from operator import itemgetter
from collections import Counter
import matplotlib.pyplot as plt
import random

app = Flask(__name__)

@app.route("/getMdsRandCorrData", methods=['GET'])
def getMdsRandCorrData():


    ##########################################
    ######### TASK 0 Pre-proccessing #########
    ##########################################

    # Parameters
    sample_size = 1000

    # import csv file
    with open('static/data/Clean-Data.csv', 'r') as f:
        reader = csv.reader(f)
        inFile = list(reader)
        rowName = inFile[0]
        inFile = inFile[1:][1:]
        # print(inFile)

    # All row names
    rowName = rowName[1:]

    # All input data
    # inputData = [inFile[i][1:] for i in range(0, len(inFile))]
    inputData = [inFile[i] for i in range(0, len(inFile))]

    ##########################################
    ############ TASK 1 Sampling  ############
    ##########################################

    # Task (1a) Random-sampling: 2000 -> 1000

    randInputData = [inputData[i] for i in random.sample(range(len(inputData)), sample_size)]
    randInputDatawithcountries =randInputData 

    randInputData = [randInputData[i][1:] for i in range(0, len(randInputData))]
    
    ##########################################
    ############### TASK 3 MDS ###############
    ##########################################

    ## Task 3(a) euclidean_distances
    randInputData = np.asarray(randInputData)

    similarities = euclidean_distances(randInputData)
    mdsRandCorrOutputData = MDS(n_components=2, dissimilarity="precomputed").fit(similarities).embedding_
    # mdsRandCorrOutputData = np.append(mdsRandCorrOutputData, randInputData, 1)
    mdsRandCorrOutputData = mdsRandCorrOutputData.tolist()
    randInputData = randInputData.tolist()


    # outputData =  pd.DataFrame(mdsRandCorrOutputData, columns=rowName)
    return { "data": [ { "headers": rowName,"randomInputData":randInputDatawithcountries , "data": mdsRandCorrOutputData } ] }

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    df = pd.read_csv("data/hfi.csv")
    # year = 2008
    # year_data = df.loc[df['year'] == year]
    # hf_rank_data = year_data[['year','ISO_code','countries','hf_rank']]
    # with open('static/json/world_ranking_'+str(year)+'.tsv','wt') as out_file:
    #     tsv_writer = csv.writer(out_file, delimiter='\t')
    #     tsv_writer.writerow(['id','name','rank'])
    #     for i in range(hf_rank_data.shape[0]):
    #         if hf_rank_data['hf_rank'][i+1296] > 0:
    #             tsv_writer.writerow([hf_rank_data['ISO_code'][i+1296], hf_rank_data['countries'][i+1296], str(int(hf_rank_data['hf_rank'][i+1296]))])
    app.run(debug=True)