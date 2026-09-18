export default function createController(service) {
    return {
        async getAll(req, res) {
            try {
                const items = await service.getAll();
                return res.status(200).json(items);
            }
            catch (err) {
                return res.status(500).json({ error: "Failed to fetch items" });
            }
        },

        async getById(req, res) {
            try {
                const item = await service.getById(req.params.id);
                if (!item) return res.status(404).json({ error: "Not found" });
                return res.status(200).json(item);
            }
            catch (err) {
                return res.status(400).json({ error: "Invalid id format" });
            }
        },

        async create(req, res) {
            try {
                const created = await service.create(req.body);
                return res.status(201).json(created);
            }
            catch (err) {
                const statusCode = err.statusCode || 500;
                const message = err.message || "Failed to create item";
                return res.status(statusCode).json({ message });
            }
        },

        async update(req, res) {
            try {
                const updated = await service.update(req.params.id, req.body);
                if (!updated) return res.status(404).json({ error: "Not found" });
                return res.status(200).json(updated);
            }
            catch (err) {
                console.error('Update error:', err);
                return res.status(500).json({ error: "Failed to update item" });
            }
        },

        async remove(req, res) {
            try {
                const removed = await service.remove(req.params.id);
                if (!removed || removed.deletedCount === 0) return res.status(404).json({ error: "Not found" });
                return res.status(200).json(removed);
            }
            catch (err) {
                return res.status(400).json({ error: "Invalid id format" });
            }
        }
    }
}