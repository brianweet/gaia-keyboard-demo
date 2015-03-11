class BivariateGauss {
    private _mean(x: number[]){
        var sum = 0;
        for (var i = 0; i < x.length; i++) {
            sum += x[i];
        }
        var mean = sum/x.length;
        return mean;
    }
    private _variance(x: number[], mean?: number){
        if(!mean)
            mean = this._mean(x);

        var variance = 0;
        for (var i = 0; i < x.length; i++) {
            variance += Math.pow(x[i] - mean, 2);
        }     
        variance = variance / (x.length - 1);
        return variance
    }

    static getDistributionStatistics(x: number[], y: number[]){
        var meanX = this.prototype._mean(x),
            meanY = this.prototype._mean(y),
            covariance = 0,
            varianceX = 0,
            varianceY = 0;

        for (var i = 0; i < x.length; i++) {
            varianceX += Math.pow(+x[i] - meanX, 2);
            varianceY += Math.pow(+y[i] - meanY, 2);
            covariance += (+x[i] - meanX)*(+y[i] - meanY);
        }
        
        varianceX = varianceX / (x.length - 1);
        varianceY = varianceY / (x.length - 1);
        covariance = covariance / (x.length -1);
        if(isNaN(varianceX))
            return;
        else
            return new KeyDistribution(meanX, meanY, varianceX, varianceY, covariance);
    }

    static getDeterminant(matrix: Array<Array<number>>){
        //[a b; c d]
        //det = ad - bc
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    static getInverseMatrix(matrix: Array<Array<number>>, determinant?: number){
        // I = [1 0; 0 1] = identity matrix
        // A = [a b; c d] = [varX cov; cov varY] = input matrix
        // A^-1 = [? ?;? ?] = inverse matrix
        // Where A * A^-1 = I

        // Steps:
        // A^-1 = 1/det(A) * adj(A)
        // det(A) = a*d - b*c
        // adj(A) = [d -b; -c a] = [varY -cov; -cov varX]
        if(matrix.length !== 2 || matrix[0].length !== 2 || matrix[1].length !== 2)
            throw new Error('Expected a 2 by 2 input matrix');

        if(matrix[0][1] !== matrix[1][0])
            throw new Error('Expected input matrix: [varX cov; cov varY]');

        if(!determinant)
            determinant = this.getDeterminant(matrix);
                
        var inverseMatrix = [];
        inverseMatrix[0] = [];
        inverseMatrix[1] = [];
        
        //Take negative
        inverseMatrix[0][1] =
        inverseMatrix[1][0] = -matrix[0][1] / determinant;
        //swap a and d
        inverseMatrix[0][0] = matrix[1][1] / determinant;
        inverseMatrix[1][1] = matrix[0][0] / determinant;
        return inverseMatrix;
    }

    static pdf(keydist: KeyDistribution, x: number, y: number){
        // pdf = (2*Math.PI)^(-nrOfDimensions/2) * determinant^.5 * e^(-1/2 * ([x y]-[meanX meanY])' * inverseMatrix * ([x y]-[meanX meanY]))
        // mu as row vector [muX muY]

        // Subtract mu from given coordinate
        // [x y]-[muX muY]
        x = x - keydist.meanX;
        y = y - keydist.meanY;

        
        //  Multiply the inversematrix with new x and y 'vector'
        //  inverseMatrix * ([x y]-[muX muY])
        var v1 = keydist.inverseMatrix[0][0] * x + keydist.inverseMatrix[0][1] * y;
        var v2 = keydist.inverseMatrix[1][0] * x + keydist.inverseMatrix[1][1] * y;
        // Multiply new variables with ([x y]-[muX muY])'
        // ([x y]-[muX muY])' * inverseMatrix * ([x y]-[muX muY])
        var v3 = x * v1 + y * v2;

        var result = Math.exp(-.5 * v3) / (2 * Math.PI * Math.sqrt(keydist.determinant));
        return result;
    }
}

class KeyDistribution {
    public determinant: number;
    public inputMatrix: Array<Array<number>>;
    public inverseMatrix: Array<Array<number>>;
    constructor(public meanX: number, 
                public meanY: number, 
                public varianceX: number, 
                public varianceY: number, 
                public covariance: number){
        this.inputMatrix = [];
        this.inputMatrix[0] = [varianceX, covariance];
        this.inputMatrix[1] = [covariance, varianceY];
        this.determinant = BivariateGauss.getDeterminant(this.inputMatrix);
        this.inverseMatrix = BivariateGauss.getInverseMatrix(this.inputMatrix, this.determinant);
    }    

    calcGauss(x: number, y: number){
        BivariateGauss.pdf(this, x, y);
    }
}