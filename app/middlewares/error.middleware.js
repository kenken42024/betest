export const asyncHandler = (controller) => {
    return async(request, response, next) => {
        try {
            await controller(request, response, next)
        }
        catch(error) {
            next(error)
        }
    }
}