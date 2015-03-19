var Temp = (function () {
    function Temp() {
    }
    Temp.prototype.mean = function (samples) {
        var mean = new Point(0, 0), N = samples.length;
        for (var i = 0; i < N; i++) {
            mean.x += samples[i].x;
            mean.y += samples[i].y;
        }
        mean.x = mean.x / N;
        mean.y = mean.y / N;
        return mean;
    };
    Temp.prototype.covariance = function (samples) {
        var mean = this.mean(samples), covariance = 0, N = samples.length;
        for (var i = 0; i < N; i++) {
            covariance += (samples[i].x - mean.x) * (samples[i].y - mean.y);
        }
        covariance = covariance / (N - 1);
        return covariance;
    };
    Temp.prototype.variance = function (samples) {
        var mean = this.mean(samples), variance = new Point(0, 0), N = samples.length;
        for (var i = 0; i < N; i++) {
            variance.x += Math.pow(samples[i].x - mean.x, 2);
            variance.y += Math.pow(samples[i].y - mean.y, 2);
        }
        variance.x = variance.x / (N - 1);
        variance.y = variance.y / (N - 1);
        return variance;
    };
    return Temp;
})();
var BivariateGaussHelper = (function () {
    function BivariateGaussHelper() {
    }
    BivariateGaussHelper.prototype._mean = function (samples) {
        var mean = new Point(0, 0), N = samples.length;
        for (var i = 0; i < N; i++) {
            mean.x += samples[i].x;
            mean.y += samples[i].y;
        }
        mean.x = mean.x / N;
        mean.y = mean.y / N;
        return mean;
    };
    BivariateGaussHelper.prototype._variance = function (x, mean) {
        var variance = 0;
        for (var i = 0; i < x.length; i++) {
            variance += Math.pow(x[i] - mean, 2);
        }
        variance = variance / (x.length - 1);
        return variance;
    };
    BivariateGaussHelper.getDeterminant = function (matrix) {
        //[a b; c d]
        //det = ad - bc
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    };
    BivariateGaussHelper.getInverseMatrix = function (matrix, determinant) {
        // I = [1 0; 0 1] = identity matrix
        // A = [a b; c d] = [varX cov; cov varY] = input matrix
        // A^-1 = [? ?;? ?] = inverse matrix
        // Where A * A^-1 = I
        // Steps:
        // A^-1 = 1/det(A) * adj(A)
        // det(A) = a*d - b*c
        // adj(A) = [d -b; -c a] = [varY -cov; -cov varX]
        if (matrix.length !== 2 || matrix[0].length !== 2 || matrix[1].length !== 2)
            throw new Error('Expected a 2 by 2 input matrix');
        if (matrix[0][1] !== matrix[1][0])
            throw new Error('Expected input matrix: [varX cov; cov varY]');
        if (!determinant)
            determinant = this.getDeterminant(matrix);
        var inverseMatrix = [];
        inverseMatrix[0] = [];
        inverseMatrix[1] = [];
        //Take negative
        inverseMatrix[0][1] = inverseMatrix[1][0] = -matrix[0][1] / determinant;
        //swap a and d
        inverseMatrix[0][0] = matrix[1][1] / determinant;
        inverseMatrix[1][1] = matrix[0][0] / determinant;
        return inverseMatrix;
    };
    BivariateGaussHelper.getDistributionStatistics = function (samples) {
        var mean = this.prototype._mean(samples), covariance = 0, varianceX = 0, varianceY = 0, N = samples.length;
        var diffX, diffY;
        for (var i = 0; i < N; i++) {
            diffX = +samples[i].x - +mean.x, diffY = +samples[i].y - +mean.y;
            varianceX += Math.pow(diffX, 2);
            varianceY += Math.pow(diffY, 2);
            covariance += diffX * diffY;
        }
        varianceX = varianceX / (N - 1);
        varianceY = varianceY / (N - 1);
        covariance = covariance / (N - 1);
        if (isNaN(varianceX))
            return;
        else
            return new KeyDistributionParameters(mean.x, mean.y, varianceX, varianceY, covariance);
    };
    return BivariateGaussHelper;
})();
var BivariateGauss = (function () {
    function BivariateGauss(keyDistribution) {
        this.keyDistribution = keyDistribution;
        this.covMatrix = [];
        this.covMatrix[0] = [keyDistribution.varianceX, keyDistribution.covariance];
        this.covMatrix[1] = [keyDistribution.covariance, keyDistribution.varianceY];
        this.determinant = BivariateGaussHelper.getDeterminant(this.covMatrix);
        this.inverseMatrix = BivariateGaussHelper.getInverseMatrix(this.covMatrix, this.determinant);
    }
    BivariateGauss.prototype.pdf = function (x, y) {
        // pdf = (2*Math.PI)^(-nrOfDimensions/2) * determinant^.5 * e^(-1/2 * ([x y]-[meanX meanY])' * inverseMatrix * ([x y]-[meanX meanY]))
        // mu as row vector [muX muY]
        // Subtract mu from given coordinate
        // [x y]-[muX muY]
        x = x - this.keyDistribution.meanX;
        y = y - this.keyDistribution.meanY;
        //  Multiply the inversematrix with new x and y 'vector'
        //  inverseMatrix * ([x y]-[muX muY])
        var v1 = this.inverseMatrix[0][0] * x + this.inverseMatrix[0][1] * y;
        var v2 = this.inverseMatrix[1][0] * x + this.inverseMatrix[1][1] * y;
        // Multiply new variables with ([x y]-[muX muY])'
        // ([x y]-[muX muY])' * inverseMatrix * ([x y]-[muX muY])
        var v3 = x * v1 + y * v2;
        var result = Math.exp(-.5 * v3) / (2 * Math.PI * Math.sqrt(this.determinant));
        return result;
    };
    BivariateGauss.prototype.mahalanobis = function (x, y) {
        // Subtract mu from given coordinate
        // [x y]-[muX muY]
        x = x - this.keyDistribution.meanX;
        y = y - this.keyDistribution.meanY;
        //  Multiply the inversematrix with new x and y 'vector'
        //  inverseMatrix * ([x y]-[muX muY])
        var v1 = this.inverseMatrix[0][0] * x + this.inverseMatrix[0][1] * y;
        var v2 = this.inverseMatrix[1][0] * x + this.inverseMatrix[1][1] * y;
        // Multiply new variables with ([x y]-[muX muY])'
        // ([x y]-[muX muY])' * inverseMatrix * ([x y]-[muX muY])
        var v3 = x * v1 + y * v2;
        return Math.sqrt(v3);
    };
    return BivariateGauss;
})();
var KeyDistributionParameters = (function () {
    function KeyDistributionParameters(meanX, meanY, varianceX, varianceY, covariance) {
        this.meanX = meanX;
        this.meanY = meanY;
        this.varianceX = varianceX;
        this.varianceY = varianceY;
        this.covariance = covariance;
    }
    return KeyDistributionParameters;
})();
