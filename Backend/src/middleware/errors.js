import httpStatus from "http-status";

export const notFound = (req, res) => {
    res.status(httpStatus.NOT_FOUND).json({message: "Route not found"});
};

// Express 5 forwards rejected promises here, so controllers don't need their own try/catch.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    if(err.type === "entity.parse.failed") {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Request body is not valid JSON"});
    }
    if(err.type === "entity.too.large") {
        return res.status(httpStatus.REQUEST_TOO_LONG).json({message: "Request body is too large"});
    }
    console.error(err);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: "Something went wrong. Please try again."});
};
